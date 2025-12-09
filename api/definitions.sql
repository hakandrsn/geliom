create table public.group_join_requests (
                                            id uuid not null default gen_random_uuid (),
                                            group_id uuid not null,
                                            requester_id uuid not null,
                                            status text not null default 'pending'::text,
                                            created_at timestamp with time zone null default now(),
                                            updated_at timestamp with time zone null default now(),
                                            constraint group_join_requests_pkey primary key (id),
                                            constraint group_join_requests_group_id_requester_id_key unique (group_id, requester_id),
                                            constraint group_join_requests_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
                                            constraint group_join_requests_requester_id_fkey foreign KEY (requester_id) references users (id) on delete CASCADE,
                                            constraint group_join_requests_status_check check (
                                                (
                                                    status = any (
                                                                  array[
                                                                      'pending'::text,
                                                                  'approved'::text,
                                                                  'rejected'::text
        ]
                                                        )
                                                    )
                                                )
) TABLESPACE pg_default;

create table public.group_members (
                                      group_id uuid not null,
                                      user_id uuid not null,
                                      joined_at timestamp with time zone null default now(),
                                      constraint group_members_pkey primary key (group_id, user_id),
                                      constraint group_members_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
                                      constraint group_members_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.groups (
                               id uuid not null default gen_random_uuid (),
                               owner_id uuid not null,
                               type text not null,
                               name text not null,
                               invite_code text not null,
                               member_limit integer not null default 5,
                               created_at timestamp with time zone null default now(),
                               constraint groups_pkey primary key (id),
                               constraint groups_invite_code_key unique (invite_code),
                               constraint groups_owner_id_fkey foreign KEY (owner_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.moods (
                              id serial not null,
                              text text not null,
                              emoji text null,
                              group_id uuid null,
                              constraint moods_pkey primary key (id),
                              constraint moods_text_key unique (text),
                              constraint moods_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_moods_group_id on public.moods using btree (group_id) TABLESPACE pg_default;

create table public.muted_notifications (
                                            muter_user_id uuid not null,
                                            muted_user_id uuid not null,
                                            constraint muted_notifications_pkey primary key (muter_user_id, muted_user_id),
                                            constraint muted_notifications_muted_user_id_fkey foreign KEY (muted_user_id) references users (id) on delete CASCADE,
                                            constraint muted_notifications_muter_user_id_fkey foreign KEY (muter_user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.nicknames (
                                  group_id uuid not null,
                                  setter_user_id uuid not null,
                                  target_user_id uuid not null,
                                  nickname text not null,
                                  constraint nicknames_pkey primary key (group_id, setter_user_id, target_user_id),
                                  constraint nicknames_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
                                  constraint nicknames_setter_user_id_fkey foreign KEY (setter_user_id) references users (id) on delete CASCADE,
                                  constraint nicknames_target_user_id_fkey foreign KEY (target_user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.notification_rate_limits (
                                                 id uuid not null default gen_random_uuid (),
                                                 sender_id uuid not null,
                                                 receiver_id uuid not null,
                                                 group_id uuid null,
                                                 notification_type text not null,
                                                 last_sent_at timestamp with time zone not null default now(),
                                                 created_at timestamp with time zone null default now(),
                                                 constraint notification_rate_limits_pkey primary key (id),
                                                 constraint notification_rate_limits_sender_id_receiver_id_group_id_not_key unique (
                                                                                                                                    sender_id,
                                                                                                                                    receiver_id,
                                                                                                                                    group_id,
                                                                                                                                    notification_type
                                                     ),
                                                 constraint notification_rate_limits_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
                                                 constraint notification_rate_limits_receiver_id_fkey foreign KEY (receiver_id) references users (id) on delete CASCADE,
                                                 constraint notification_rate_limits_sender_id_fkey foreign KEY (sender_id) references users (id) on delete CASCADE,
                                                 constraint notification_rate_limits_notification_type_check check (
                                                     (
                                                         notification_type = any (
                                                                                  array[
                                                                                      'join_request'::text,
                                                                                  'join_request_status'::text,
                                                                                  'direct_invite'::text,
                                                                                  'status_update'::text,
                                                                                  'mood_update'::text,
                                                                                  'event_reminder'::text
        ]
                                                             )
                                                         )
                                                     )
) TABLESPACE pg_default;

create index IF not exists idx_rate_limits_sender_receiver on public.notification_rate_limits using btree (sender_id, receiver_id) TABLESPACE pg_default;

create index IF not exists idx_rate_limits_group on public.notification_rate_limits using btree (group_id) TABLESPACE pg_default;

create index IF not exists idx_rate_limits_type on public.notification_rate_limits using btree (notification_type) TABLESPACE pg_default;

create index IF not exists idx_rate_limits_last_sent on public.notification_rate_limits using btree (last_sent_at) TABLESPACE pg_default;

create table public.pending_notifications (
                                              id uuid not null default gen_random_uuid (),
                                              sender_id uuid not null,
                                              receiver_ids uuid[] not null,
                                              group_id uuid not null,
                                              status_id integer not null,
                                              scheduled_at timestamp with time zone not null,
                                              created_at timestamp with time zone null default now(),
                                              updated_at timestamp with time zone null default now(),
                                              constraint pending_notifications_pkey primary key (id),
                                              constraint pending_notifications_sender_group_unique unique (sender_id, group_id),
                                              constraint pending_notifications_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
                                              constraint pending_notifications_sender_id_fkey foreign KEY (sender_id) references users (id) on delete CASCADE,
                                              constraint pending_notifications_status_id_fkey foreign KEY (status_id) references statuses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pending_notifications_scheduled_at on public.pending_notifications using btree (scheduled_at) TABLESPACE pg_default;

create index IF not exists idx_pending_notifications_sender_id on public.pending_notifications using btree (sender_id) TABLESPACE pg_default;

create index IF not exists idx_pending_notifications_group_id on public.pending_notifications using btree (group_id) TABLESPACE pg_default;

create trigger trigger_update_pending_notifications_updated_at BEFORE
    update on pending_notifications for EACH row
    execute FUNCTION update_pending_notifications_updated_at ();

create table public.scheduled_events (
                                         id uuid not null default gen_random_uuid (),
                                         group_id uuid not null,
                                         creator_id uuid not null,
                                         title text not null,
                                         event_time timestamp with time zone not null,
                                         notification_time timestamp with time zone null,
                                         created_at timestamp with time zone null default now(),
                                         constraint scheduled_events_pkey primary key (id),
                                         constraint scheduled_events_creator_id_fkey foreign KEY (creator_id) references users (id) on delete CASCADE,
                                         constraint scheduled_events_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.statuses (
                                 id serial not null,
                                 text text not null,
                                 notifies boolean not null default false,
                                 is_custom boolean not null default false,
                                 owner_id uuid null,
                                 messages text[] null,
                                 group_id uuid null,
                                 emoji text null,
                                 constraint statuses_pkey primary key (id),
                                 constraint statuses_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
                                 constraint statuses_owner_id_fkey foreign KEY (owner_id) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_statuses_group_id on public.statuses using btree (group_id) TABLESPACE pg_default;

create table public.subscriptions (
                                      user_id uuid not null,
                                      status text not null default 'free'::text,
                                      expires_at timestamp with time zone null,
                                      constraint subscriptions_pkey primary key (user_id),
                                      constraint subscriptions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_group_moods (
                                         user_id uuid not null,
                                         group_id uuid not null,
                                         mood_id integer not null,
                                         updated_at timestamp with time zone null default now(),
                                         constraint user_group_moods_pkey primary key (user_id, group_id),
                                         constraint user_group_moods_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
                                         constraint user_group_moods_mood_id_fkey foreign KEY (mood_id) references moods (id) on delete CASCADE,
                                         constraint user_group_moods_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists user_group_moods_user_id_null_group_unique on public.user_group_moods using btree (user_id) TABLESPACE pg_default
    where
    (group_id is null);

create index IF not exists idx_user_group_moods_group_id on public.user_group_moods using btree (group_id) TABLESPACE pg_default;

create index IF not exists idx_user_group_moods_user_id_group_id on public.user_group_moods using btree (user_id, group_id) TABLESPACE pg_default;

create index IF not exists idx_user_group_moods_mood_id on public.user_group_moods using btree (mood_id) TABLESPACE pg_default;

create table public.user_statuses (
                                      user_id uuid not null,
                                      status_id integer not null,
                                      updated_at timestamp with time zone null default now(),
                                      group_id uuid not null,
                                      constraint user_statuses_pkey primary key (user_id, group_id),
                                      constraint user_statuses_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
                                      constraint user_statuses_status_id_fkey foreign KEY (status_id) references statuses (id),
                                      constraint user_statuses_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create unique INDEX IF not exists user_statuses_user_id_null_group_unique on public.user_statuses using btree (user_id) TABLESPACE pg_default
    where
    (group_id is null);

create index IF not exists idx_user_statuses_group_id on public.user_statuses using btree (group_id) TABLESPACE pg_default;

create index IF not exists idx_user_statuses_user_id_group_id on public.user_statuses using btree (user_id, group_id) TABLESPACE pg_default;

create table public.users (
                              id uuid not null,
                              custom_user_id text not null,
                              display_name text null,
                              photo_url text null,
                              show_mood boolean not null default false,
                              onesignal_player_id text null,
                              updated_at timestamp with time zone null default now(),
                              mood_id integer null,
                              has_completed_onboarding boolean null default false,
                              email text null,
                              avatar text null,
                              constraint users_pkey primary key (id),
                              constraint users_custom_user_id_key unique (custom_user_id),
                              constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
                              constraint users_mood_id_fkey foreign KEY (mood_id) references moods (id)
) TABLESPACE pg_default;