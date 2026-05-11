package com.pawstar.pawster.repository;

import com.pawstar.pawster.model.Message;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    /** All messages in a conversation, oldest-first */
    List<Message> findByUserIdOrderByCreatedAtAsc(Integer userId);

    /** Unread messages sent by admin that the user hasn't read */
    long countByUserIdAndSenderRoleAndIsReadFalse(Integer userId, String senderRole);

    /** Unread messages sent by users that admin hasn't read */
    long countBySenderRoleAndIsReadFalse(String senderRole);

    /** Mark admin→user messages as read when user opens chat */
    @Query("{ 'user_id': ?0, 'sender_role': 'admin', 'is_read': false }")
    @Update("{ '$set': { 'is_read': true } }")
    void markAdminMessagesReadForUser(Integer userId);

    /** Mark user→admin messages as read when admin opens conversation */
    @Query("{ 'user_id': ?0, 'sender_role': 'user', 'is_read': false }")
    @Update("{ '$set': { 'is_read': true } }")
    void markUserMessagesReadForAdmin(Integer userId);

    /**
     * Conversation summaries for admin inbox.
     * Groups by userId, picks latest message content + timestamp, counts unread.
     */
    @Aggregation(pipeline = {
        "{ $sort: { 'created_at': -1 } }",
        """
        { $group: {
            _id: '$user_id',
            lastMessage:   { $first: '$content' },
            lastMessageAt: { $first: '$created_at' },
            unreadCount: {
                $sum: {
                    $cond: [
                        { $and: [
                            { $eq: ['$sender_role', 'user'] },
                            { $eq: ['$is_read', false] }
                        ]},
                        1, 0
                    ]
                }
            }
        }}
        """,
        "{ $sort: { 'lastMessageAt': -1 } }"
    })
    List<ConversationSummaryProjection> findConversationSummaries();

    interface ConversationSummaryProjection {
        Integer get_id();
        String  getLastMessage();
        Object  getLastMessageAt();
        Long    getUnreadCount();
    }
}