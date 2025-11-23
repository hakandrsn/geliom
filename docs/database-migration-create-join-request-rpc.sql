-- Function to handle group join requests securely and atomically
create or replace function create_join_request(
  p_group_id uuid,
  p_requester_id uuid,
  p_invite_code text
) returns jsonb
language plpgsql
security definer -- Runs with privileges of the creator (to access tables if RLS blocks, but we'll rely on internal logic)
as $$
declare
  v_group_id uuid;
  v_existing_member_id uuid;
  v_existing_request_id uuid;
  v_new_request_id uuid;
  v_request_status text;
begin
  -- 1. Validate Group and Invite Code
  select id into v_group_id
  from groups
  where id = p_group_id and invite_code = p_invite_code;

  if v_group_id is null then
    return jsonb_build_object('success', false, 'error', 'Geçersiz davet kodu veya grup bulunamadı.');
  end if;

  -- 2. Check if user is already a member
  select user_id into v_existing_member_id
  from group_members
  where group_id = p_group_id and user_id = p_requester_id;

  if v_existing_member_id is not null then
    return jsonb_build_object('success', false, 'error', 'Zaten bu grubun üyesisiniz.');
  end if;

  -- 3. Check for existing PENDING request
  select id into v_existing_request_id
  from group_join_requests
  where group_id = p_group_id 
    and requester_id = p_requester_id 
    and status = 'pending';

  if v_existing_request_id is not null then
    return jsonb_build_object('success', false, 'error', 'Bu grup için zaten bekleyen bir isteğiniz var.');
  end if;

  -- 4. Clean up old APPROVED or REJECTED requests (if user is not a member anymore)
  -- This handles cases where a user was removed or rejected previously and wants to try again
  delete from group_join_requests
  where group_id = p_group_id 
    and requester_id = p_requester_id 
    and status in ('approved', 'rejected');

  -- 5. Create new request
  insert into group_join_requests (group_id, requester_id, status)
  values (p_group_id, p_requester_id, 'pending')
  returning id, status into v_new_request_id, v_request_status;

  return jsonb_build_object(
    'success', true, 
    'data', jsonb_build_object(
      'id', v_new_request_id,
      'group_id', p_group_id,
      'requester_id', p_requester_id,
      'status', v_request_status
    )
  );

exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;
