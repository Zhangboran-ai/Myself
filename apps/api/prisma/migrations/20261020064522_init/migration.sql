-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(50) NOT NULL,
    `avatar_url` VARCHAR(500) NULL,
    `role` ENUM('OWNER', 'EDITOR') NOT NULL DEFAULT 'OWNER',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `user_agent` VARCHAR(300) NULL,
    `ip_hash` VARCHAR(64) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_expires_at_idx`(`user_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `handle` VARCHAR(50) NOT NULL,
    `headline` VARCHAR(120) NOT NULL,
    `bio_md` TEXT NOT NULL,
    `avatar_url` VARCHAR(500) NULL,
    `location` VARCHAR(100) NULL,
    `status_label` VARCHAR(60) NULL,
    `status_available` BOOLEAN NOT NULL DEFAULT true,
    `email` VARCHAR(120) NOT NULL,
    `resume_url` VARCHAR(500) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `social_links` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(50) NOT NULL,
    `href` VARCHAR(500) NOT NULL,
    `icon` VARCHAR(50) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `experiences` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company` VARCHAR(100) NOT NULL,
    `role` VARCHAR(100) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `summary` VARCHAR(500) NULL,
    `kind` ENUM('WORK', 'EDUCATION') NOT NULL DEFAULT 'WORK',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skill_groups` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skills` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `group_id` BIGINT NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `level` ENUM('PROFICIENT', 'FAMILIAR', 'LEARNING') NOT NULL DEFAULT 'FAMILIAR',
    `note` VARCHAR(200) NULL,
    `icon` VARCHAR(50) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `skills_group_id_sort_order_idx`(`group_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(160) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `summary` VARCHAR(300) NOT NULL,
    `body_md` MEDIUMTEXT NOT NULL,
    `cover_url` VARCHAR(500) NULL,
    `cover_blurhash` VARCHAR(100) NULL,
    `role` VARCHAR(100) NULL,
    `year` INTEGER NOT NULL,
    `status` ENUM('LIVE', 'OSS', 'ARCHIVED') NOT NULL DEFAULT 'LIVE',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `demo_url` VARCHAR(500) NULL,
    `repo_url` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `view_count` BIGINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `projects_slug_key`(`slug`),
    INDEX `idx_projects_featured`(`featured`, `sort_order`),
    INDEX `idx_projects_year`(`year` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tech_tags` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(60) NOT NULL,

    UNIQUE INDEX `tech_tags_name_key`(`name`),
    UNIQUE INDEX `tech_tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_tech_tags` (
    `project_id` BIGINT NOT NULL,
    `tech_tag_id` BIGINT NOT NULL,

    INDEX `project_tech_tags_tech_tag_id_idx`(`tech_tag_id`),
    PRIMARY KEY (`project_id`, `tech_tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(160) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `summary` VARCHAR(300) NOT NULL,
    `body_md` MEDIUMTEXT NOT NULL,
    `cover_url` VARCHAR(500) NULL,
    `author_id` BIGINT NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `reading_time` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `word_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `view_count` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `posts_slug_key`(`slug`),
    INDEX `idx_posts_status_published`(`status`, `published_at` DESC),
    INDEX `idx_posts_pinned`(`pinned`, `published_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(60) NOT NULL,
    `post_count` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `tags_name_key`(`name`),
    UNIQUE INDEX `tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_tags` (
    `post_id` BIGINT NOT NULL,
    `tag_id` BIGINT NOT NULL,

    INDEX `post_tags_tag_id_idx`(`tag_id`),
    PRIMARY KEY (`post_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_revisions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `post_id` BIGINT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `body_md` MEDIUMTEXT NOT NULL,
    `editor_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `post_revisions_post_id_created_at_idx`(`post_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `storage_key` VARCHAR(300) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `mime` VARCHAR(80) NOT NULL,
    `size` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `blurhash` VARCHAR(100) NULL,
    `checksum` CHAR(64) NOT NULL,
    `alt` VARCHAR(200) NULL,
    `created_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `media_storage_key_key`(`storage_key`),
    UNIQUE INDEX `media_checksum_key`(`checksum`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `subject` VARCHAR(120) NOT NULL,
    `content` TEXT NOT NULL,
    `ip_hash` CHAR(64) NULL,
    `status` ENUM('NEW', 'READ', 'REPLIED', 'SPAM') NOT NULL DEFAULT 'NEW',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_messages_created_at_idx`(`created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slug_redirects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `entity_type` VARCHAR(20) NOT NULL,
    `old_slug` VARCHAR(160) NOT NULL,
    `new_slug` VARCHAR(160) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_slug_redirects_type_old`(`entity_type`, `old_slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_settings` (
    `setting_key` VARCHAR(60) NOT NULL,
    `value` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`setting_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revalidate_jobs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `target_tag` VARCHAR(120) NOT NULL,
    `payload` JSON NULL,
    `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'DONE', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `next_run_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `revalidate_jobs_status_next_run_at_idx`(`status`, `next_run_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skills` ADD CONSTRAINT `skills_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `skill_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tech_tags` ADD CONSTRAINT `project_tech_tags_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tech_tags` ADD CONSTRAINT `project_tech_tags_tech_tag_id_fkey` FOREIGN KEY (`tech_tag_id`) REFERENCES `tech_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_revisions` ADD CONSTRAINT `post_revisions_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_revisions` ADD CONSTRAINT `post_revisions_editor_id_fkey` FOREIGN KEY (`editor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
