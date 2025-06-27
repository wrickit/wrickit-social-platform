--
-- PostgreSQL database dump
--

-- Dumped from database version 15.3
-- Dumped by pg_dump version 15.3

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    name text NOT NULL,
    class character varying(10) NOT NULL,
    division character varying(5) NOT NULL,
    profile_image_url text,
    bio text,
    security_question text,
    security_answer text,
    has_completed_tutorial boolean DEFAULT false,
    last_active_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

--
-- Name: relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relationships (
    id integer NOT NULL,
    from_user_id integer NOT NULL,
    to_user_id integer NOT NULL,
    type character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: relationships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.relationships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.relationships_id_seq OWNED BY public.relationships.id;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    author_id integer NOT NULL,
    content text NOT NULL,
    audience character varying(10) NOT NULL,
    likes integer DEFAULT 0,
    media_urls text[],
    media_types text[],
    voice_message_url text,
    voice_message_duration integer,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    from_user_id integer NOT NULL,
    to_user_id integer NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    voice_message_url text,
    voice_message_duration integer,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;

--
-- Name: friend_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friend_groups (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: friend_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.friend_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: friend_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.friend_groups_id_seq OWNED BY public.friend_groups.id;

--
-- Name: group_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_messages (
    id integer NOT NULL,
    from_user_id integer NOT NULL,
    group_id integer NOT NULL,
    content text NOT NULL,
    voice_message_url text,
    voice_message_duration integer,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: group_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: group_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_messages_id_seq OWNED BY public.group_messages.id;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    author_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;

--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;

--
-- Name: friend_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friend_group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT now()
);

--
-- Name: friend_group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.friend_group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: friend_group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.friend_group_members_id_seq OWNED BY public.friend_group_members.id;

--
-- Name: group_message_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_message_reads (
    id integer NOT NULL,
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    read_at timestamp without time zone DEFAULT now()
);

--
-- Name: group_message_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_message_reads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: group_message_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_message_reads_id_seq OWNED BY public.group_message_reads.id;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    related_user_id integer,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;

--
-- Name: disciplinary_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disciplinary_actions (
    id integer NOT NULL,
    reported_user_id integer NOT NULL,
    reporter_user_id integer NOT NULL,
    reason character varying(100) NOT NULL,
    description text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    votes integer DEFAULT 0,
    is_anonymous boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: disciplinary_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.disciplinary_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: disciplinary_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.disciplinary_actions_id_seq OWNED BY public.disciplinary_actions.id;

--
-- Name: disciplinary_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disciplinary_votes (
    id integer NOT NULL,
    action_id integer NOT NULL,
    voter_id integer NOT NULL,
    vote character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: disciplinary_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.disciplinary_votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: disciplinary_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.disciplinary_votes_id_seq OWNED BY public.disciplinary_votes.id;

--
-- Name: loops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loops (
    id integer NOT NULL,
    author_id integer NOT NULL,
    video_url text NOT NULL,
    thumbnail_url text,
    description text,
    song_title text,
    song_artist text,
    song_url text,
    song_start_time integer DEFAULT 0,
    song_duration integer DEFAULT 30,
    likes integer DEFAULT 0,
    views integer DEFAULT 0,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: loops_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: loops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loops_id_seq OWNED BY public.loops.id;

--
-- Name: loop_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loop_likes (
    id integer NOT NULL,
    loop_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: loop_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loop_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: loop_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loop_likes_id_seq OWNED BY public.loop_likes.id;

--
-- Name: loop_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loop_views (
    id integer NOT NULL,
    loop_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: loop_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loop_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: loop_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loop_views_id_seq OWNED BY public.loop_views.id;

--
-- Name: user_interests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_interests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    category text NOT NULL,
    score integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: user_interests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_interests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: user_interests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_interests_id_seq OWNED BY public.user_interests.id;

--
-- Name: loop_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loop_interactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    loop_id integer NOT NULL,
    interaction_type text NOT NULL,
    duration_watched integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: loop_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loop_interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: loop_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loop_interactions_id_seq OWNED BY public.loop_interactions.id;

--
-- Name: hashtags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hashtags (
    id integer NOT NULL,
    name text NOT NULL,
    usage_count integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: hashtags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hashtags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: hashtags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hashtags_id_seq OWNED BY public.hashtags.id;

--
-- Name: post_hashtags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_hashtags (
    id integer NOT NULL,
    post_id integer NOT NULL,
    hashtag_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: post_hashtags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_hashtags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: post_hashtags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_hashtags_id_seq OWNED BY public.post_hashtags.id;

--
-- Name: message_hashtags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_hashtags (
    id integer NOT NULL,
    message_id integer NOT NULL,
    hashtag_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: message_hashtags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_hashtags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: message_hashtags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_hashtags_id_seq OWNED BY public.message_hashtags.id;

--
-- Name: post_mentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_mentions (
    id integer NOT NULL,
    post_id integer NOT NULL,
    mentioned_user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: post_mentions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_mentions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: post_mentions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_mentions_id_seq OWNED BY public.post_mentions.id;

--
-- Name: message_mentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_mentions (
    id integer NOT NULL,
    message_id integer NOT NULL,
    mentioned_user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: message_mentions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_mentions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: message_mentions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_mentions_id_seq OWNED BY public.message_mentions.id;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    session_start timestamp without time zone DEFAULT now(),
    session_end timestamp without time zone,
    duration_minutes integer DEFAULT 0,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;

--
-- Name: user_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    session_id integer,
    activity_type character varying(50) NOT NULL,
    action_type character varying(50) NOT NULL,
    target_id integer,
    duration_seconds integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: user_activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: user_activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_activity_logs_id_seq OWNED BY public.user_activity_logs.id;

--
-- Name: daily_user_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_user_stats (
    id integer NOT NULL,
    user_id integer NOT NULL,
    date timestamp without time zone NOT NULL,
    total_time_minutes integer DEFAULT 0,
    sessions_count integer DEFAULT 0,
    messages_count integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    loops_count integer DEFAULT 0,
    relationships_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: daily_user_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_user_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: daily_user_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_user_stats_id_seq OWNED BY public.daily_user_stats.id;

--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

--
-- Name: relationships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships ALTER COLUMN id SET DEFAULT nextval('public.relationships_id_seq'::regclass);

--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);

--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);

--
-- Name: friend_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_groups ALTER COLUMN id SET DEFAULT nextval('public.friend_groups_id_seq'::regclass);

--
-- Name: group_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages ALTER COLUMN id SET DEFAULT nextval('public.group_messages_id_seq'::regclass);

--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);

--
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);

--
-- Name: friend_group_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_group_members ALTER COLUMN id SET DEFAULT nextval('public.friend_group_members_id_seq'::regclass);

--
-- Name: group_message_reads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_message_reads ALTER COLUMN id SET DEFAULT nextval('public.group_message_reads_id_seq'::regclass);

--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);

--
-- Name: disciplinary_actions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_actions ALTER COLUMN id SET DEFAULT nextval('public.disciplinary_actions_id_seq'::regclass);

--
-- Name: disciplinary_votes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_votes ALTER COLUMN id SET DEFAULT nextval('public.disciplinary_votes_id_seq'::regclass);

--
-- Name: loops id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loops ALTER COLUMN id SET DEFAULT nextval('public.loops_id_seq'::regclass);

--
-- Name: loop_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_likes ALTER COLUMN id SET DEFAULT nextval('public.loop_likes_id_seq'::regclass);

--
-- Name: loop_views id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_views ALTER COLUMN id SET DEFAULT nextval('public.loop_views_id_seq'::regclass);

--
-- Name: user_interests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_interests ALTER COLUMN id SET DEFAULT nextval('public.user_interests_id_seq'::regclass);

--
-- Name: loop_interactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_interactions ALTER COLUMN id SET DEFAULT nextval('public.loop_interactions_id_seq'::regclass);

--
-- Name: hashtags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hashtags ALTER COLUMN id SET DEFAULT nextval('public.hashtags_id_seq'::regclass);

--
-- Name: post_hashtags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_hashtags ALTER COLUMN id SET DEFAULT nextval('public.post_hashtags_id_seq'::regclass);

--
-- Name: message_hashtags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_hashtags ALTER COLUMN id SET DEFAULT nextval('public.message_hashtags_id_seq'::regclass);

--
-- Name: post_mentions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_mentions ALTER COLUMN id SET DEFAULT nextval('public.post_mentions_id_seq'::regclass);

--
-- Name: message_mentions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_mentions ALTER COLUMN id SET DEFAULT nextval('public.message_mentions_id_seq'::regclass);

--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);

--
-- Name: user_activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_logs ALTER COLUMN id SET DEFAULT nextval('public.user_activity_logs_id_seq'::regclass);

--
-- Name: daily_user_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_user_stats ALTER COLUMN id SET DEFAULT nextval('public.daily_user_stats_id_seq'::regclass);

--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);

--
-- Name: relationships relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_pkey PRIMARY KEY (id);

--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);

--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

--
-- Name: friend_groups friend_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_groups
    ADD CONSTRAINT friend_groups_pkey PRIMARY KEY (id);

--
-- Name: group_messages group_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_pkey PRIMARY KEY (id);

--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);

--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);

--
-- Name: friend_group_members friend_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_group_members
    ADD CONSTRAINT friend_group_members_pkey PRIMARY KEY (id);

--
-- Name: group_message_reads group_message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_message_reads
    ADD CONSTRAINT group_message_reads_pkey PRIMARY KEY (id);

--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

--
-- Name: disciplinary_actions disciplinary_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_actions
    ADD CONSTRAINT disciplinary_actions_pkey PRIMARY KEY (id);

--
-- Name: disciplinary_votes disciplinary_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_votes
    ADD CONSTRAINT disciplinary_votes_pkey PRIMARY KEY (id);

--
-- Name: loops loops_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loops
    ADD CONSTRAINT loops_pkey PRIMARY KEY (id);

--
-- Name: loop_likes loop_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_likes
    ADD CONSTRAINT loop_likes_pkey PRIMARY KEY (id);

--
-- Name: loop_views loop_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_views
    ADD CONSTRAINT loop_views_pkey PRIMARY KEY (id);

--
-- Name: user_interests user_interests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_pkey PRIMARY KEY (id);

--
-- Name: loop_interactions loop_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_interactions
    ADD CONSTRAINT loop_interactions_pkey PRIMARY KEY (id);

--
-- Name: hashtags hashtags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hashtags
    ADD CONSTRAINT hashtags_pkey PRIMARY KEY (id);

--
-- Name: hashtags hashtags_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hashtags
    ADD CONSTRAINT hashtags_name_unique UNIQUE (name);

--
-- Name: post_hashtags post_hashtags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_hashtags
    ADD CONSTRAINT post_hashtags_pkey PRIMARY KEY (id);

--
-- Name: message_hashtags message_hashtags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_hashtags
    ADD CONSTRAINT message_hashtags_pkey PRIMARY KEY (id);

--
-- Name: post_mentions post_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_mentions
    ADD CONSTRAINT post_mentions_pkey PRIMARY KEY (id);

--
-- Name: message_mentions message_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_mentions
    ADD CONSTRAINT message_mentions_pkey PRIMARY KEY (id);

--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);

--
-- Name: user_activity_logs user_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_logs
    ADD CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id);

--
-- Name: daily_user_stats daily_user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_user_stats
    ADD CONSTRAINT daily_user_stats_pkey PRIMARY KEY (id);

--
-- Name: relationships relationships_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id);

--
-- Name: relationships relationships_to_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_to_user_id_users_id_fk FOREIGN KEY (to_user_id) REFERENCES public.users(id);

--
-- Name: posts posts_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);

--
-- Name: messages messages_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id);

--
-- Name: messages messages_to_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_to_user_id_users_id_fk FOREIGN KEY (to_user_id) REFERENCES public.users(id);

--
-- Name: group_messages group_messages_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id);

--
-- Name: group_messages group_messages_group_id_friend_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_group_id_friend_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.friend_groups(id);

--
-- Name: comments comments_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

--
-- Name: comments comments_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);

--
-- Name: post_likes post_likes_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

--
-- Name: post_likes post_likes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: friend_group_members friend_group_members_group_id_friend_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_group_members
    ADD CONSTRAINT friend_group_members_group_id_friend_groups_id_fk FOREIGN KEY (group_id) REFERENCES public.friend_groups(id);

--
-- Name: friend_group_members friend_group_members_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_group_members
    ADD CONSTRAINT friend_group_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: group_message_reads group_message_reads_message_id_group_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_message_reads
    ADD CONSTRAINT group_message_reads_message_id_group_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.group_messages(id);

--
-- Name: group_message_reads group_message_reads_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_message_reads
    ADD CONSTRAINT group_message_reads_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: notifications notifications_related_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_user_id_users_id_fk FOREIGN KEY (related_user_id) REFERENCES public.users(id);

--
-- Name: disciplinary_actions disciplinary_actions_reported_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_actions
    ADD CONSTRAINT disciplinary_actions_reported_user_id_users_id_fk FOREIGN KEY (reported_user_id) REFERENCES public.users(id);

--
-- Name: disciplinary_actions disciplinary_actions_reporter_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_actions
    ADD CONSTRAINT disciplinary_actions_reporter_user_id_users_id_fk FOREIGN KEY (reporter_user_id) REFERENCES public.users(id);

--
-- Name: disciplinary_votes disciplinary_votes_action_id_disciplinary_actions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_votes
    ADD CONSTRAINT disciplinary_votes_action_id_disciplinary_actions_id_fk FOREIGN KEY (action_id) REFERENCES public.disciplinary_actions(id);

--
-- Name: disciplinary_votes disciplinary_votes_voter_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinary_votes
    ADD CONSTRAINT disciplinary_votes_voter_id_users_id_fk FOREIGN KEY (voter_id) REFERENCES public.users(id);

--
-- Name: loops loops_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loops
    ADD CONSTRAINT loops_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);

--
-- Name: loop_likes loop_likes_loop_id_loops_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_likes
    ADD CONSTRAINT loop_likes_loop_id_loops_id_fk FOREIGN KEY (loop_id) REFERENCES public.loops(id);

--
-- Name: loop_likes loop_likes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_likes
    ADD CONSTRAINT loop_likes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: loop_views loop_views_loop_id_loops_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_views
    ADD CONSTRAINT loop_views_loop_id_loops_id_fk FOREIGN KEY (loop_id) REFERENCES public.loops(id);

--
-- Name: loop_views loop_views_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_views
    ADD CONSTRAINT loop_views_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: user_interests user_interests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: loop_interactions loop_interactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_interactions
    ADD CONSTRAINT loop_interactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: loop_interactions loop_interactions_loop_id_loops_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loop_interactions
    ADD CONSTRAINT loop_interactions_loop_id_loops_id_fk FOREIGN KEY (loop_id) REFERENCES public.loops(id);

--
-- Name: post_hashtags post_hashtags_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_hashtags
    ADD CONSTRAINT post_hashtags_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

--
-- Name: post_hashtags post_hashtags_hashtag_id_hashtags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_hashtags
    ADD CONSTRAINT post_hashtags_hashtag_id_hashtags_id_fk FOREIGN KEY (hashtag_id) REFERENCES public.hashtags(id);

--
-- Name: message_hashtags message_hashtags_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_hashtags
    ADD CONSTRAINT message_hashtags_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;

--
-- Name: message_hashtags message_hashtags_hashtag_id_hashtags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_hashtags
    ADD CONSTRAINT message_hashtags_hashtag_id_hashtags_id_fk FOREIGN KEY (hashtag_id) REFERENCES public.hashtags(id);

--
-- Name: post_mentions post_mentions_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_mentions
    ADD CONSTRAINT post_mentions_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

--
-- Name: post_mentions post_mentions_mentioned_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_mentions
    ADD CONSTRAINT post_mentions_mentioned_user_id_users_id_fk FOREIGN KEY (mentioned_user_id) REFERENCES public.users(id);

--
-- Name: message_mentions message_mentions_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_mentions
    ADD CONSTRAINT message_mentions_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;

--
-- Name: message_mentions message_mentions_mentioned_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_mentions
    ADD CONSTRAINT message_mentions_mentioned_user_id_users_id_fk FOREIGN KEY (mentioned_user_id) REFERENCES public.users(id);

--
-- Name: user_sessions user_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: user_activity_logs user_activity_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_logs
    ADD CONSTRAINT user_activity_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- Name: user_activity_logs user_activity_logs_session_id_user_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_logs
    ADD CONSTRAINT user_activity_logs_session_id_user_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.user_sessions(id);

--
-- Name: daily_user_stats daily_user_stats_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_user_stats
    ADD CONSTRAINT daily_user_stats_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- PostgreSQL database dump complete
--