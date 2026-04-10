-- =====================================================
-- 04_lookup_data.sql
-- Seed data for Categories only (Venues table removed)
-- =====================================================

-- Seed Categories
INSERT IGNORE INTO Categories (category_id, name, description, icon) VALUES
(1, 'Technology', 'Everything from AI to Hardware', 'Cpu'),
(2, 'Music', 'Concerts, festivals and band performances', 'Music'),
(3, 'Sports', 'Tournaments, marathons and outdoors', 'Trophy'),
(4, 'Business', 'Conferences, networking and summits', 'Briefcase'),
(5, 'Art', 'Exhibitions, workshops and creative meetups', 'Palette'),
(6, 'Food', 'Festivals, tastings and carnivals', 'Utensils');
