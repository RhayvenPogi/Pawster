package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /** All messages in a conversation, oldest-first */
    List<Message> findByUserIdOrderByCreatedAtAsc(Integer userId);

    /**
     * Unread count for a user's inbox:
     * messages sent by admin that the USER hasn't read yet.
     */
    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.userId = :userId AND m.senderRole = 'admin' AND m.isRead = false")
    long countUnreadForUser(@Param("userId") Integer userId);

    /**
     * Unread count for admin's inbox:
     * messages sent by users that the ADMIN hasn't read yet.
     * Optionally scoped to one conversation (targetUserId = null → all).
     */
    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.senderRole = 'user' AND m.isRead = false")
    long countUnreadForAdmin();

    /** Mark admin→user messages as read (called when user opens the chat) */
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.isRead = true " +
           "WHERE m.userId = :userId AND m.senderRole = 'admin' AND m.isRead = false")
    void markAdminMessagesReadForUser(@Param("userId") Integer userId);

    /** Mark user→admin messages as read (called when admin opens that conversation) */
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.isRead = true " +
           "WHERE m.userId = :userId AND m.senderRole = 'user' AND m.isRead = false")
    void markUserMessagesReadForAdmin(@Param("userId") Integer userId);

    /**
     * Latest message per distinct user — used to build the admin inbox list.
     * Returns [userId, content, createdAt, unreadCount].
     */
    @Query(value = """
        SELECT
            m.user_id                                         AS userId,
            m.content                                         AS lastMessage,
            m.created_at                                      AS lastMessageAt,
            (SELECT COUNT(*) FROM messages s
             WHERE s.user_id = m.user_id
               AND s.sender_role = 'user'
               AND s.is_read = false)                         AS unreadCount
        FROM messages m
        WHERE m.created_at = (
            SELECT MAX(m2.created_at)
            FROM messages m2
            WHERE m2.user_id = m.user_id
        )
        ORDER BY m.created_at DESC
        """, nativeQuery = true)
    List<Object[]> findConversationSummariesRaw();
}