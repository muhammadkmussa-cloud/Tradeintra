CREATE INDEX IF NOT EXISTS support_tickets_account ON tradeintra_studio.support_tickets(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_messages_account ON tradeintra_studio.support_messages(account_id, ticket_id, created_at);
CREATE INDEX IF NOT EXISTS announcements_account ON tradeintra_studio.announcements(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_account ON tradeintra_studio.audit_events(account_id, created_at DESC);
