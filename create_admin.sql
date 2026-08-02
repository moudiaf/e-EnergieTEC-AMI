INSERT INTO auth.users (id, email, password, email_verified, metadata, is_project_admin)
VALUES (
  gen_random_uuid(),
  'admin@nigelec.ne',
  crypt('admin123', gen_salt('bf')),
  true,
  '{"name": "Administrateur", "role": "admin"}'::jsonb,
  true
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email;
