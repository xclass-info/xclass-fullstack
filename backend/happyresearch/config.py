import os


def _database_url():
    url = os.environ.get("DATABASE_URL", "postgresql+psycopg:///happyresearch_dev")
    # Heroku hands out postgres:// URLs; SQLAlchemy wants an explicit driver.
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def _list(name, default=""):
    return [v.strip() for v in os.environ.get(name, default).split(",") if v.strip()]


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-secret-change-me-not-for-production")
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    # Where links in emails point, and which origins may call the API.
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://happyresearch.org").rstrip("/")
    FRONTEND_ORIGINS = _list(
        "FRONTEND_ORIGIN", "https://happyresearch.org"
    ) + ["http://localhost:5173"]
    # Public base URL of this API, used to build /files/... links.
    API_URL = os.environ.get("API_URL", "http://localhost:5050").rstrip("/")

    # Accounts with these emails get the admin role (see migrate + login).
    ADMIN_EMAILS = [e.lower() for e in _list("ADMIN_EMAILS", "zhenhepan@gmail.com")]
    # Inbox that receives Contact Us / On-demand Learning messages.
    TEAM_INBOX = os.environ.get("TEAM_INBOX", "happyprogramming.us@gmail.com")

    AUTH_TOKEN_DAYS = int(os.environ.get("AUTH_TOKEN_DAYS", "30"))

    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = ("HappyResearch", os.environ.get("MAIL_USERNAME"))
    MAIL_SUPPRESS_SEND = os.environ.get("MAIL_SUPPRESS_SEND") == "1"
    # Legacy shared key for /api/send-verification-email (pre-migration frontend).
    MAIL_API_KEY = os.environ.get("MAIL_API_KEY")
    # Daily.co video rooms for approved 1-on-1 sessions (server-side only).
    DAILY_API_KEY = os.environ.get("DAILY_API_KEY")

    # S3-compatible object storage (Cloudflare R2 / AWS S3).
    S3_BUCKET = os.environ.get("S3_BUCKET")
    S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL")
    S3_ACCESS_KEY_ID = os.environ.get("S3_ACCESS_KEY_ID")
    S3_SECRET_ACCESS_KEY = os.environ.get("S3_SECRET_ACCESS_KEY")
    S3_REGION = os.environ.get("S3_REGION", "auto")
    MAX_UPLOAD_MB = 10

    # Firebase Auth scrypt parameters, for verifying imported password hashes.
    # From Firebase Console > Authentication > Users > ⋮ > Password hash parameters.
    FIREBASE_HASH_SIGNER_KEY = os.environ.get("FIREBASE_HASH_SIGNER_KEY")
    FIREBASE_HASH_SALT_SEPARATOR = os.environ.get("FIREBASE_HASH_SALT_SEPARATOR", "Bw==")
    FIREBASE_HASH_ROUNDS = int(os.environ.get("FIREBASE_HASH_ROUNDS", "8"))
    FIREBASE_HASH_MEM_COST = int(os.environ.get("FIREBASE_HASH_MEM_COST", "14"))

    RATELIMIT_STORAGE_URI = "memory://"
