-- Extend the existing event allowlist for the beta access funnel.

alter table public.site_analytics_events
  drop constraint if exists site_analytics_events_event_name_check;

alter table public.site_analytics_events
  add constraint site_analytics_events_event_name_check
  check (event_name in (
    'page_view',
    'access_landing_view',
    'access_form_open',
    'access_request_submitted'
  ));
