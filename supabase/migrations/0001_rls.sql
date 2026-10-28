-- Reference RLS policies for Postgres/Supabase deployment.
-- Dev uses SQLite + app-level authorization; these policies are the production hardening.

alter table projects enable row level security;
create policy projects_tenant on projects
  for all using (organization_id = current_setting('request.jwt.claims', true)::json->>'org_id');

-- Repeat pattern for boq_items, work_logs, evidence_files, variations, billing_packets, billing_packet_lines, audit_events, organization_members, organization_settings.
-- Storage bucket 'evidence' must be private; access via signed URLs after ownership check in server route.
