-- ==============================================================================
-- Life OS: Row Level Security (RLS) Automated Verification Script
-- ==============================================================================
-- INSTRUCTIONS FOR RUNNING IN SUPABASE SQL EDITOR:
-- 1. Ensure you have run supabase/schema.sql first to create tables & policies.
-- 2. User Setup (Optional if auth.users enforces FKs):
--    If your project enforces auth.users foreign keys, you can create test users
--    in the Supabase Dashboard:
--       Authentication -> Users -> "Add User" -> Create:
--       - user_a@example.com
--       - user_b@example.com
--    Then copy their UUIDs and replace v_user_a and v_user_b below.
--    Or create them directly via SQL:
--       INSERT INTO auth.users (id, email)
--       VALUES 
--         ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user_a@example.com'),
--         ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user_b@example.com')
--       ON CONFLICT (id) DO NOTHING;
-- 3. Paste this entire script into the Supabase SQL Editor and click "RUN".
-- 4. It will return a table of PASS / FAIL rows covering all 4 tables.
--    Zero test rows are left behind (transaction ends with ROLLBACK).
-- ==============================================================================

BEGIN;

-- Temporary table to hold test results
CREATE TEMP TABLE IF NOT EXISTS rls_test_results (
    test_num integer,
    target_table text,
    test_name text,
    status text,
    detail text
) ON COMMIT DROP;

-- Ensure authenticated and anon roles can insert result rows
GRANT ALL ON rls_test_results TO authenticated, anon, public;
ALTER TABLE rls_test_results DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_user_a uuid := '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
  v_user_b uuid := '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;
  
  v_item_a uuid := '99999999-9999-9999-9999-999999999991'::uuid;
  v_item_a2 uuid := '99999999-9999-9999-9999-999999999992'::uuid;
  v_item_spoof uuid := '88888888-8888-8888-8888-888888888888'::uuid;
  v_tag_id uuid := '77777777-7777-7777-7777-777777777771'::uuid;
  v_tag_spoof uuid := '77777777-7777-7777-7777-777777777772'::uuid;
  v_link_id uuid := '66666666-6666-6666-6666-666666666661'::uuid;
  v_link_spoof uuid := '66666666-6666-6666-6666-666666666662'::uuid;
  v_device_a text := 'dev-device-a-01';
  v_device_spoof text := 'dev-device-spoof-02';

  v_count int;
  v_updated int;
  v_rejected boolean;
BEGIN
  -- --------------------------------------------------------------------------
  -- TABLE 1: items
  -- --------------------------------------------------------------------------

  -- Test 1: User A inserts and reads own item
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

  INSERT INTO items (
    id, user_id, type, title, created_at, updated_at
  ) VALUES (
    v_item_a, v_user_a, 'note', 'User A Secret Note', 1000, 1000
  );

  INSERT INTO items (
    id, user_id, type, title, created_at, updated_at
  ) VALUES (
    v_item_a2, v_user_a, 'task', 'User A Linked Task', 1000, 1000
  );

  SELECT count(*) INTO v_count FROM items WHERE id = v_item_a;
  IF v_count = 1 THEN
    INSERT INTO rls_test_results VALUES (1, 'items', 'User A inserts and reads own item', 'PASS', 'User A successfully inserted and queried own item');
  ELSE
    INSERT INTO rls_test_results VALUES (1, 'items', 'User A inserts and reads own item', 'FAIL', 'User A could not query own item');
  END IF;

  -- Test 2: User B reads zero rows of User A's items
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO v_count FROM items WHERE id = v_item_a;
  IF v_count = 0 THEN
    INSERT INTO rls_test_results VALUES (2, 'items', 'User B reads zero rows of User A items', 'PASS', 'User B isolated: 0 rows leaked');
  ELSE
    INSERT INTO rls_test_results VALUES (2, 'items', 'User B reads zero rows of User A items', 'FAIL', format('User B leaked %s rows of User A', v_count));
  END IF;

  -- Test 3: User B cannot update User A's row
  UPDATE items SET title = 'Compromised by User B' WHERE id = v_item_a;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    INSERT INTO rls_test_results VALUES (3, 'items', 'User B cannot update User A item', 'PASS', '0 rows updated by unauthorized user');
  ELSE
    INSERT INTO rls_test_results VALUES (3, 'items', 'User B cannot update User A item', 'FAIL', format('%s rows updated by unauthorized user', v_updated));
  END IF;

  -- Test 4: User B cannot insert with user_id = User A (WITH CHECK enforcement)
  -- FIX: Using boolean flag v_rejected to ensure RAISE EXCEPTION is not caught by own block
  v_rejected := false;
  BEGIN
    INSERT INTO items (
      id, user_id, type, title, created_at, updated_at
    ) VALUES (
      v_item_spoof, v_user_a, 'task', 'Spoofed Task', 1000, 1000
    );
  EXCEPTION WHEN OTHERS THEN
    v_rejected := true;
  END;

  IF v_rejected THEN
    INSERT INTO rls_test_results VALUES (4, 'items', 'User B spoofing User A user_id rejected', 'PASS', 'WITH CHECK policy correctly rejected spoofed insert');
  ELSE
    INSERT INTO rls_test_results VALUES (4, 'items', 'User B spoofing User A user_id rejected', 'FAIL', 'WITH CHECK failed: spoofed item inserted successfully');
  END IF;

  -- Test 5: Anonymous (unauthenticated) reads zero rows of items
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

  SELECT count(*) INTO v_count FROM items WHERE id = v_item_a;
  IF v_count = 0 THEN
    INSERT INTO rls_test_results VALUES (5, 'items', 'Anonymous reads zero rows of items', 'PASS', 'Anonymous access blocked: 0 rows returned');
  ELSE
    INSERT INTO rls_test_results VALUES (5, 'items', 'Anonymous reads zero rows of items', 'FAIL', format('Anonymous leaked %s rows', v_count));
  END IF;

  -- --------------------------------------------------------------------------
  -- TABLE 2: tags
  -- --------------------------------------------------------------------------

  -- Test 6: User A inserts and reads tag
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

  INSERT INTO tags (
    id, user_id, item_id, tag, created_at
  ) VALUES (
    v_tag_id, v_user_a, v_item_a, 'finance', 1000
  );

  SELECT count(*) INTO v_count FROM tags WHERE id = v_tag_id;
  IF v_count = 1 THEN
    INSERT INTO rls_test_results VALUES (6, 'tags', 'User A inserts and reads own tag', 'PASS', 'Tag inserted and verified');
  ELSE
    INSERT INTO rls_test_results VALUES (6, 'tags', 'User A inserts and reads own tag', 'FAIL', 'User A could not query own tag');
  END IF;

  -- Test 7: User B reads zero rows of User A tags
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO v_count FROM tags WHERE id = v_tag_id;
  IF v_count = 0 THEN
    INSERT INTO rls_test_results VALUES (7, 'tags', 'User B reads zero tags of User A', 'PASS', '0 tags visible to User B');
  ELSE
    INSERT INTO rls_test_results VALUES (7, 'tags', 'User B reads zero tags of User A', 'FAIL', format('%s tags visible to User B', v_count));
  END IF;

  -- Test 8: User B cannot insert tag for User A
  v_rejected := false;
  BEGIN
    INSERT INTO tags (
      id, user_id, item_id, tag, created_at
    ) VALUES (
      v_tag_spoof, v_user_a, v_item_a, 'spoofed-tag', 1000
    );
  EXCEPTION WHEN OTHERS THEN
    v_rejected := true;
  END;

  IF v_rejected THEN
    INSERT INTO rls_test_results VALUES (8, 'tags', 'User B spoofing tag for User A rejected', 'PASS', 'WITH CHECK rejected spoofed tag');
  ELSE
    INSERT INTO rls_test_results VALUES (8, 'tags', 'User B spoofing tag for User A rejected', 'FAIL', 'WITH CHECK failed: spoofed tag allowed');
  END IF;

  -- Test 9: Anonymous reads zero tags
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

  SELECT count(*) INTO v_count FROM tags WHERE id = v_tag_id;
  IF v_count = 0 THEN
    INSERT INTO rls_test_results VALUES (9, 'tags', 'Anonymous reads zero tags', 'PASS', 'Anonymous access blocked: 0 tags returned');
  ELSE
    INSERT INTO rls_test_results VALUES (9, 'tags', 'Anonymous reads zero tags', 'FAIL', format('Anonymous leaked %s tags', v_count));
  END IF;

  -- --------------------------------------------------------------------------
  -- TABLE 3: links
  -- --------------------------------------------------------------------------

  -- Test 10: User A inserts and reads link
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

  INSERT INTO links (
    id, user_id, source_id, target_id, created_at
  ) VALUES (
    v_link_id, v_user_a, v_item_a, v_item_a2, 1000
  );

  SELECT count(*) INTO v_count FROM links WHERE id = v_link_id;
  IF v_count = 1 THEN
    INSERT INTO rls_test_results VALUES (10, 'links', 'User A inserts and reads own link', 'PASS', 'Link inserted and verified');
  ELSE
    INSERT INTO rls_test_results VALUES (10, 'links', 'User A inserts and reads own link', 'FAIL', 'User A could not query own link');
  END IF;

  -- Test 11: User B reads zero links of User A
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO v_count FROM links WHERE id = v_link_id;
  IF v_count = 0 THEN
    INSERT INTO rls_test_results VALUES (11, 'links', 'User B reads zero links of User A', 'PASS', '0 links visible to User B');
  ELSE
    INSERT INTO rls_test_results VALUES (11, 'links', 'User B reads zero links of User A', 'FAIL', format('%s links visible to User B', v_count));
  END IF;

  -- Test 12: User B cannot insert link for User A
  v_rejected := false;
  BEGIN
    INSERT INTO links (
      id, user_id, source_id, target_id, created_at
    ) VALUES (
      v_link_spoof, v_user_a, v_item_a, v_item_a2, 1000
    );
  EXCEPTION WHEN OTHERS THEN
    v_rejected := true;
  END;

  IF v_rejected THEN
    INSERT INTO rls_test_results VALUES (12, 'links', 'User B spoofing link for User A rejected', 'PASS', 'WITH CHECK rejected spoofed link');
  ELSE
    INSERT INTO rls_test_results VALUES (12, 'links', 'User B spoofing link for User A rejected', 'FAIL', 'WITH CHECK failed: spoofed link allowed');
  END IF;

  -- Test 13: Anonymous reads zero links
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

  SELECT count(*) INTO v_count FROM links WHERE id = v_link_id;
  IF v_count = 0 THEN
    INSERT INTO rls_test_results VALUES (13, 'links', 'Anonymous reads zero links', 'PASS', 'Anonymous access blocked: 0 links returned');
  ELSE
    INSERT INTO rls_test_results VALUES (13, 'links', 'Anonymous reads zero links', 'FAIL', format('Anonymous leaked %s links', v_count));
  END IF;

  -- --------------------------------------------------------------------------
  -- TABLE 4: device_sync
  -- --------------------------------------------------------------------------

  -- Test 14: User A inserts and reads device_sync
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

  INSERT INTO device_sync (
    device_id, user_id, last_sync_at
  ) VALUES (
    v_device_a, v_user_a, 1000
  );

  SELECT count(*) INTO v_count FROM device_sync WHERE device_id = v_device_a;
  IF v_count = 1 THEN
    INSERT INTO rls_test_results VALUES (14, 'device_sync', 'User A inserts and reads device_sync', 'PASS', 'Device sync record inserted and verified');
  ELSE
    INSERT INTO rls_test_results VALUES (14, 'device_sync', 'User A inserts and reads device_sync', 'FAIL', 'User A could not query device_sync');
  END IF;

  -- Test 15: User B reads zero device_sync of User A
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO v_count FROM device_sync WHERE device_id = v_device_a;
  IF v_count = 0 THEN
    INSERT INTO rls_test_results VALUES (15, 'device_sync', 'User B reads zero device_sync of User A', 'PASS', '0 device records visible to User B');
  ELSE
    INSERT INTO rls_test_results VALUES (15, 'device_sync', 'User B reads zero device_sync of User A', 'FAIL', format('%s device records visible to User B', v_count));
  END IF;

  -- Test 16: User B cannot insert device_sync for User A
  v_rejected := false;
  BEGIN
    INSERT INTO device_sync (
      device_id, user_id, last_sync_at
    ) VALUES (
      v_device_spoof, v_user_a, 1000
    );
  EXCEPTION WHEN OTHERS THEN
    v_rejected := true;
  END;

  IF v_rejected THEN
    INSERT INTO rls_test_results VALUES (16, 'device_sync', 'User B spoofing device_sync for User A rejected', 'PASS', 'WITH CHECK rejected spoofed device_sync');
  ELSE
    INSERT INTO rls_test_results VALUES (16, 'device_sync', 'User B spoofing device_sync for User A rejected', 'FAIL', 'WITH CHECK failed: spoofed device_sync allowed');
  END IF;

  -- Test 17: Anonymous reads zero device_sync
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

  SELECT count(*) INTO v_count FROM device_sync WHERE device_id = v_device_a;
  IF v_count = 0 THEN
    INSERT INTO rls_test_results VALUES (17, 'device_sync', 'Anonymous reads zero device_sync', 'PASS', 'Anonymous access blocked: 0 device records returned');
  ELSE
    INSERT INTO rls_test_results VALUES (17, 'device_sync', 'Anonymous reads zero device_sync', 'FAIL', format('Anonymous leaked %s device records', v_count));
  END IF;

  -- Restore role back to postgres
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);

  -- Explicit cleanup within transaction as secondary defense
  DELETE FROM links WHERE id = v_link_id;
  DELETE FROM tags WHERE id = v_tag_id;
  DELETE FROM items WHERE id IN (v_item_a, v_item_a2);
  DELETE FROM device_sync WHERE device_id = v_device_a;

END $$;

-- Return results table to the Supabase SQL Editor UI
SELECT 
  test_num, 
  target_table, 
  test_name, 
  status, 
  detail 
FROM rls_test_results 
ORDER BY test_num;

-- Transaction ends with ROLLBACK to leave zero artifacts behind
ROLLBACK;
