"""Research posts, projects and showcase entries - public reads, and
create/edit/delete by the mentor who owns them."""
from flask import Blueprint, jsonify, request

from .. import storage
from ..errors import ApiError
from ..extensions import db, limiter
from ..models import Project, Research, Showcase, Teacher, utcnow
from ..security import current_live_teacher, current_user
from ..serializers import showcase_json
from ..uploads import read_upload
from . import body
from .teachers import is_live, live_teachers

bp = Blueprint("content", __name__, url_prefix="/api")

MAX_PREREQUISITES = 5

KINDS = {
    "research": Research,
    "projects": Project,
    "showcase": Showcase,
}


def _json(row):
    return showcase_json(row) if isinstance(row, Showcase) else row.to_dict()


def _clean(model, data):
    """The form fields from `data`, normalized for this model."""
    out = {}
    for key in model.FORM_FIELDS:
        if key not in data:
            continue
        value = data[key]
        if isinstance(value, str):
            value = value.strip()
        out[key] = value
    if "prerequisites" in out:
        prereqs = out["prerequisites"] or []
        if not isinstance(prereqs, list):
            raise ApiError(400, "INVALID_FIELD", "prerequisites must be a list.")
        out["prerequisites"] = [
            p.strip() for p in prereqs if isinstance(p, str) and p.strip()
        ][:MAX_PREREQUISITES]
    if "seats" in out:
        try:
            out["seats"] = int(out["seats"])
        except (TypeError, ValueError):
            raise ApiError(400, "INVALID_FIELD", "seats must be a whole number.")
        if out["seats"] < 1:
            raise ApiError(400, "INVALID_FIELD", "seats must be at least 1.")
    for key in ("details", "outputUrl"):
        if key in out and not out[key]:
            out[key] = None
    if "title" in out and not out["title"]:
        raise ApiError(400, "MISSING_FIELD", "title is required.")
    return out


def _showcase_file(data, teacher, entry=None):
    """Resolve the fileUrl/fileType sent for a showcase entry. Only a file
    this mentor uploaded via /showcase/files, or the entry's existing file,
    is accepted."""
    if "fileUrl" not in data:
        return {}
    value = data.get("fileUrl")
    if not value:
        return {"fileUrl": None, "fileType": None}
    if entry and value in (entry.fileUrl, storage.file_url(entry.fileUrl)):
        return {}
    key = storage.key_of(value)
    if not key or not key.startswith(f"showcase-files/{teacher.id}/"):
        raise ApiError(400, "INVALID_FILE", "Upload the file first.")
    file_type = data.get("fileType")
    return {"fileUrl": value, "fileType": file_type if file_type in ("image", "pdf") else None}


def _owned(model, item_id, teacher):
    row = db.session.get(model, item_id)
    if not row or row.teacherId != teacher.id:
        raise ApiError(404, "NOT_FOUND", "Not found.")
    return row


def _live_teacher_ids():
    return live_teachers().with_entities(Teacher.id)


def _register(kind, model):
    def list_items():
        q = model.query
        teacher_id = request.args.get("teacherId")
        user = current_user()
        if teacher_id:
            q = q.filter_by(teacherId=teacher_id)
        # Mentors who aren't live yet (applicants) can draft posts; those stay
        # hidden from everyone except the mentor themselves and admins.
        if not (user and (user.isAdmin or user.id == teacher_id)):
            q = q.filter(model.teacherId.in_(_live_teacher_ids()))
        status = request.args.get("status")
        if status and hasattr(model, "status"):
            q = q.filter_by(status=status)
        q = q.order_by(model.createdAt.desc().nullslast())
        limit = request.args.get("limit", type=int)
        if limit:
            q = q.limit(min(limit, 100))
        return jsonify([_json(r) for r in q.all()])

    def get_item(item_id):
        row = db.session.get(model, item_id)
        user = current_user()
        visible = row and (
            is_live(db.session.get(Teacher, row.teacherId))
            or (user and (user.isAdmin or user.id == row.teacherId))
        )
        if not visible:
            raise ApiError(404, "NOT_FOUND", "Not found.")
        return jsonify(_json(row))

    def create_item():
        teacher = current_live_teacher()
        data = body()
        row = model(**_clean(model, data))
        row.teacherId = teacher.id
        row.teacherName = teacher.name or "Teacher"
        if model is Research:
            row.status = "published"
        if model in (Research, Project):
            row.stage = "active"
            row.enrolledCount = 0
        if model is Showcase:
            for k, v in _showcase_file(data, teacher).items():
                setattr(row, k, v)
        db.session.add(row)
        db.session.commit()
        return jsonify(_json(row)), 201

    def update_item(item_id):
        teacher = current_live_teacher()
        row = _owned(model, item_id, teacher)
        data = body()
        changes = _clean(model, data)
        if model in (Research, Project) and data.get("stage") in ("active", "completed"):
            changes["stage"] = data["stage"]
        if model is Showcase:
            changes.update(_showcase_file(data, teacher, row))
        row.apply(changes, changes.keys())
        row.updatedAt = utcnow()
        db.session.commit()
        return jsonify(_json(row))

    def delete_item(item_id):
        teacher = current_live_teacher()
        row = _owned(model, item_id, teacher)
        db.session.delete(row)
        db.session.commit()
        return jsonify({"ok": True})

    bp.add_url_rule(f"/{kind}", f"list_{kind}", list_items, methods=["GET"])
    bp.add_url_rule(f"/{kind}/<item_id>", f"get_{kind}", get_item, methods=["GET"])
    bp.add_url_rule(f"/{kind}", f"create_{kind}", create_item, methods=["POST"])
    bp.add_url_rule(f"/{kind}/<item_id>", f"update_{kind}", update_item, methods=["PATCH"])
    bp.add_url_rule(f"/{kind}/<item_id>", f"delete_{kind}", delete_item, methods=["DELETE"])


for _kind, _model in KINDS.items():
    _register(_kind, _model)


@bp.post("/showcase/files")
@limiter.limit("20 per minute")
def upload_showcase_file():
    teacher = current_live_teacher()
    data, filename, content_type = read_upload(allow_pdf=True)
    ref = storage.put(
        storage.make_key(f"showcase-files/{teacher.id}", filename), data, content_type
    )
    return jsonify(
        {
            "ref": ref,
            "url": storage.file_url(ref),
            "fileType": "image" if content_type.startswith("image/") else "pdf",
        }
    ), 201
