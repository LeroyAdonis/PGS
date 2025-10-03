-- Enable required PostgreSQL extensions
-- uuid-ossp: UUID generation for primary keys
-- pgcrypto: Encryption for OAuth tokens

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
