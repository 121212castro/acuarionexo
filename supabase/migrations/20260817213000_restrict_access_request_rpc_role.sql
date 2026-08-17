-- Access requests are a signed-out entry point; existing accounts do not need it.
revoke execute on function public.submit_access_request(text, text, text, text, boolean) from authenticated;
