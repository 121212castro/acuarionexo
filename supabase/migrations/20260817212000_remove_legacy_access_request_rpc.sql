-- The web app now records the accepted legal version for every new request.
drop function if exists public.submit_access_request(text, text, text);
