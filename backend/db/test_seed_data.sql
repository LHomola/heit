--
-- PostgreSQL database dump
--

\restrict ZheSAzGZYM1hAd6SAcosfxOftX6uT41ArkdTnyDhgzWpfnIgkoWWDx9FIvdCniO

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: heit_user
--

INSERT INTO public.users (id, full_name, email, hashed_password, role, address, is_active, created_at) VALUES (1, 'B', 'b@heit.ie', '$2b$12$eSghWvKJ0S1..5PTWQhaVe/LkBKnHTkhcfVwNsReiO7OAReLJwhpy', 'resident', 'test', true, '2026-05-16 21:29:07.694263+00');
INSERT INTO public.users (id, full_name, email, hashed_password, role, address, is_active, created_at) VALUES (2, 'A', 'a@heit.ie', '$2b$12$as0zmvwll5QxKSFWhwHK4OTugLMl3t17I8r/iFsebuaFp/QQHZKD.', 'resident', 'test', true, '2026-05-16 21:29:16.853087+00');
INSERT INTO public.users (id, full_name, email, hashed_password, role, address, is_active, created_at) VALUES (3, 'M', 'm@heit.ie', '$2b$12$SLEUoXSmeYjRWcq/obABvevyPiNVkJo5sbPxasTzOyfl41USuWEd6', 'manager', 'test', true, '2026-05-16 21:36:27.086796+00');
INSERT INTO public.users (id, full_name, email, hashed_password, role, address, is_active, created_at) VALUES (4, 'C', 'c@heit.ie', '$2b$12$yOxJHo40E3cCAPnEyPAVBeY.SEke1fdZ5kIGzAQ2dIvHbFPbdGC9m', 'contractor', 'test', true, '2026-05-16 21:53:37.986767+00');


--
-- Data for Name: sensors; Type: TABLE DATA; Schema: public; Owner: heit_user
--



--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: heit_user
--

INSERT INTO public.tickets (id, title, description, category_id, status, created_by, manager_id, assigned_to, is_public, ai_suggestion, created_at, updated_at) VALUES (5, 'Cars speeding on the estate roads', 'Drivers have been driving at excessive speed on all the roads going through the estate which is major hazard to pedestrians and children playing outside. Speed bumps and speed limit signs need to be installed.', 6, 'open', 1, NULL, NULL, false, NULL, '2026-05-16 21:49:42.962081+00', '2026-05-16 21:49:42.962081+00');
INSERT INTO public.tickets (id, title, description, category_id, status, created_by, manager_id, assigned_to, is_public, ai_suggestion, created_at, updated_at) VALUES (6, 'Damaged Swing in the Children''s Park', 'One of the chains on the toddler swing has snapped, leaving it hanging dangerously. The swing set needs to be taped off and repaired before a child gets hurt.', 6, 'open', 1, NULL, NULL, false, NULL, '2026-05-16 21:50:30.641984+00', '2026-05-16 21:50:30.641984+00');
INSERT INTO public.tickets (id, title, description, category_id, status, created_by, manager_id, assigned_to, is_public, ai_suggestion, created_at, updated_at) VALUES (7, 'Overgrown Hedges Blocking the Sidewalk', 'The perimeter bushes along the main walkway haven''t been trimmed in months. They are now completely blocking the footpath, forcing parents with strollers and wheelchair users to walk on the main road.', 4, 'open', 1, NULL, NULL, false, NULL, '2026-05-16 21:50:47.785575+00', '2026-05-16 21:50:47.785575+00');
INSERT INTO public.tickets (id, title, description, category_id, status, created_by, manager_id, assigned_to, is_public, ai_suggestion, created_at, updated_at) VALUES (4, 'Water stain on ceiling in communal hallway', 'A large brown water stain has appeared on the ceiling of the second floor hallway in in the apartment building. It has been spreading over the last few days and may indicate a leak from the flat above or a roof issue.', 3, 'in_progress', 2, 3, 4, false, 'Thank you for reporting this issue. A spreading water stain on a communal ceiling definitely needs to be investigated and repaired by professionals, as it points to a leak from an apartment above or a roof issue. Residents should **not** attempt to fix such problems themselves due to safety risks (especially involving water and electrical wiring) and the technical nature of tracing and repairing leaks.

However, here are a few practical, safe steps you can take to help us address the issue more effectively or mitigate further minor damage while our team arranges for a contractor:

1.  **Observe and Document Changes:** Keep an eye on the water stain. Note if it''s getting significantly larger, darker, or if water starts to actively drip. If you notice any major changes, take new photos or a short video. This information is very helpful for our maintenance team and the contractor to understand the problem''s progression.
2.  **Place a Container (If Dripping):** If water starts actively dripping from the ceiling, please place a bucket, bowl, or even a thick towel underneath it. This will help catch the water, protect the communal flooring from further damage, and prevent the area from becoming slippery.
3.  **Avoid Touching or Poking the Area:** For your safety, please do not poke, prod, or attempt to wipe the stained area on the ceiling. There might be electrical wiring nearby (e.g., for lights), and combining water with electricity can be very dangerous.
4.  **Update Estate Management if it Worsens:** If you notice the stain growing very rapidly, if water starts dripping heavily, if the ceiling appears to be bulging significantly, or if there''s any other immediate concern, please contact the estate management again with an update. This helps us prioritize and respond quickly to escalating situations.

Remember, your safety is paramount. Please do not attempt any repairs yourself. Our team will arrange for a qualified contractor to investigate the source of the leak and carry out the necessary repairs.', '2026-05-16 21:34:28.82683+00', '2026-05-16 22:17:43.200317+00');
INSERT INTO public.tickets (id, title, description, category_id, status, created_by, manager_id, assigned_to, is_public, ai_suggestion, created_at, updated_at) VALUES (2, 'Car park barrier stuck in raised position', 'The automated barrier at the main car park entrance has been stuck open since Tuesday evening. Residents are concerned about unauthorised vehicles using the estate overnight.', 4, 'open', 2, NULL, NULL, true, NULL, '2026-05-16 21:33:09.307199+00', '2026-05-16 22:23:46.000044+00');
INSERT INTO public.tickets (id, title, description, category_id, status, created_by, manager_id, assigned_to, is_public, ai_suggestion, created_at, updated_at) VALUES (1, 'Crack appearing in stairwell wall', 'A visible crack has developed along the wall on the second floor stairwell in the apartment building. It has grown slightly over the past two weeks and should be assessed by a structural contractor.', 3, 'assigned', 2, 3, 4, true, NULL, '2026-05-16 21:32:42.12374+00', '2026-05-16 22:24:43.298627+00');
INSERT INTO public.tickets (id, title, description, category_id, status, created_by, manager_id, assigned_to, is_public, ai_suggestion, created_at, updated_at) VALUES (3, 'Abandoned bicycle blocking fire exit', 'A bicycle has been left chained to the railing directly in front of the fire exit on the ground floor of the apartment building. It is blocking the emergency route and needs to be removed.', 6, 'open', 2, NULL, NULL, true, NULL, '2026-05-16 21:33:54.222688+00', '2026-05-16 22:24:46.771942+00');
INSERT INTO public.tickets (id, title, description, category_id, status, created_by, manager_id, assigned_to, is_public, ai_suggestion, created_at, updated_at) VALUES (8, 'test', 'close button test', 4, 'closed', 2, 3, 4, false, NULL, '2026-05-18 19:38:43.157127+00', '2026-05-18 21:25:59.59824+00');


--
-- Data for Name: sensor_events; Type: TABLE DATA; Schema: public; Owner: heit_user
--



--
-- Data for Name: ticket_likes; Type: TABLE DATA; Schema: public; Owner: heit_user
--

INSERT INTO public.ticket_likes (id, ticket_id, user_id, created_at) VALUES (5, 2, 1, '2026-05-16 22:25:52.105383+00');
INSERT INTO public.ticket_likes (id, ticket_id, user_id, created_at) VALUES (6, 1, 1, '2026-05-16 22:25:52.490908+00');
INSERT INTO public.ticket_likes (id, ticket_id, user_id, created_at) VALUES (7, 1, 2, '2026-05-16 22:26:13.911953+00');


--
-- Data for Name: ticket_status_history; Type: TABLE DATA; Schema: public; Owner: heit_user
--

INSERT INTO public.ticket_status_history (id, ticket_id, old_status, new_status, changed_by, note, changed_at) VALUES (1, 4, 'open', 'assigned', 3, 'Ticket has been assigned to contractor (user id 4)', '2026-05-16 21:53:52.147736+00');
INSERT INTO public.ticket_status_history (id, ticket_id, old_status, new_status, changed_by, note, changed_at) VALUES (2, 1, 'open', 'assigned', 3, 'Ticket has been assigned to contractor (user id 4)', '2026-05-16 21:54:06.229312+00');
INSERT INTO public.ticket_status_history (id, ticket_id, old_status, new_status, changed_by, note, changed_at) VALUES (3, 4, 'assigned', 'in_progress', 4, 'test', '2026-05-16 22:14:10.077139+00');
INSERT INTO public.ticket_status_history (id, ticket_id, old_status, new_status, changed_by, note, changed_at) VALUES (4, 8, 'open', 'closed', 2, NULL, '2026-05-18 21:25:04.208829+00');
INSERT INTO public.ticket_status_history (id, ticket_id, old_status, new_status, changed_by, note, changed_at) VALUES (5, 8, 'closed', 'assigned', 3, 'Ticket has been assigned to contractor (user id 4)', '2026-05-18 21:25:38.047352+00');
INSERT INTO public.ticket_status_history (id, ticket_id, old_status, new_status, changed_by, note, changed_at) VALUES (6, 8, 'assigned', 'closed', 3, NULL, '2026-05-18 21:25:59.597019+00');


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: heit_user
--

SELECT pg_catalog.setval('public.categories_id_seq', 6, true);


--
-- Name: sensor_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: heit_user
--

SELECT pg_catalog.setval('public.sensor_events_id_seq', 1, false);


--
-- Name: sensors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: heit_user
--

SELECT pg_catalog.setval('public.sensors_id_seq', 1, false);


--
-- Name: ticket_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: heit_user
--

SELECT pg_catalog.setval('public.ticket_likes_id_seq', 7, true);


--
-- Name: ticket_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: heit_user
--

SELECT pg_catalog.setval('public.ticket_status_history_id_seq', 6, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: heit_user
--

SELECT pg_catalog.setval('public.tickets_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: heit_user
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict ZheSAzGZYM1hAd6SAcosfxOftX6uT41ArkdTnyDhgzWpfnIgkoWWDx9FIvdCniO

