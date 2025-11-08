package com.millarayne.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

/**
 * DAO for Message entity
 */
@Dao
interface MessageDao {
    @Query("SELECT * FROM messages ORDER BY timestamp ASC")
    fun getAllMessages(): Flow<List<Message>>

    @Query("SELECT * FROM messages ORDER BY timestamp DESC LIMIT :limit")
    suspend fun getRecentMessages(limit: Int): List<Message>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: Message): Long

    @Query("DELETE FROM messages")
    suspend fun deleteAllMessages()

    @Query("SELECT COUNT(*) FROM messages")
    suspend fun getMessageCount(): Int
}
