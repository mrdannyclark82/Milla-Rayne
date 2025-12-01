package com.millarayne

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.millarayne.api.MillaApiClient
import com.millarayne.data.*
import com.millarayne.ui.theme.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : ComponentActivity() {
    private val viewModel: ChatViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize database
        val database = AppDatabase.getDatabase(applicationContext)
        viewModel.initialize(database)
        
        setContent {
            MillaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ChatScreen(viewModel = viewModel)
                }
            }
        }
    }
}

class ChatViewModel : ViewModel() {
    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private lateinit var messageDao: MessageDao

    fun initialize(database: AppDatabase) {
        messageDao = database.messageDao()
        loadMessages()
    }

    private fun loadMessages() {
        viewModelScope.launch {
            try {
                messageDao.getAllMessages().collect { msgs ->
                    _messages.value = msgs
                }
            } catch (e: Exception) {
                _error.value = "Failed to load messages: ${e.localizedMessage ?: "Unknown error"}"
                android.util.Log.e("ChatViewModel", "Failed to load messages", e)
            }
        }
    }

    fun sendMessage(content: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null

                // Validate input
                if (content.isBlank()) {
                    _error.value = "Message cannot be empty"
                    return@launch
                }

                // Save user message
                val userMessage = Message(
                    content = content.trim(),
                    role = "user",
                    timestamp = System.currentTimeMillis()
                )

                try {
                    messageDao.insertMessage(userMessage)
                } catch (dbException: Exception) {
                    android.util.Log.e("ChatViewModel", "Failed to save user message to database", dbException)
                    _error.value = "Failed to save message locally: ${dbException.localizedMessage ?: "Database error"}"
                    return@launch
                }

                // Send to API
                val request = ChatRequest(message = content.trim())
                val response = try {
                    MillaApiClient.apiService.sendMessage(request)
                } catch (networkException: Exception) {
                    android.util.Log.e("ChatViewModel", "Network request failed", networkException)
                    throw networkException
                }

                if (response.isSuccessful) {
                    val chatResponse = response.body()
                    if (chatResponse != null && chatResponse.response.isNotBlank()) {
                        // Save assistant message
                        val assistantMessage = Message(
                            content = chatResponse.response,
                            role = "assistant",
                            timestamp = System.currentTimeMillis()
                        )
                        try {
                            messageDao.insertMessage(assistantMessage)
                        } catch (dbException: Exception) {
                            android.util.Log.e("ChatViewModel", "Failed to save assistant message to database", dbException)
                            _error.value = "Message sent but failed to save response locally: ${dbException.localizedMessage ?: "Database error"}"
                            return@launch
                        }
                    } else {
                        _error.value = "Received empty response from server"
                    }
                } else {
                    val errorBody = response.errorBody()?.string()
                    android.util.Log.e("ChatViewModel", "Server error: ${response.code()} - $errorBody")
                    _error.value = "Server error: ${response.code()} - ${response.message()}"
                }
            } catch (e: Exception) {
                android.util.Log.e("ChatViewModel", "Error in sendMessage", e)
                _error.value = when (e) {
                    is java.net.UnknownHostException -> "Cannot reach server. Check IP address (192.168.40.117) and network connection."
                    is java.net.ConnectException -> "Server connection refused. Make sure the server is running on port 5000."
                    is java.net.SocketTimeoutException -> "Connection timed out. Check your network and server status."
                    is retrofit2.HttpException -> "Server error (${e.code()}): ${e.message()}"
                    else -> "Network error: ${e.localizedMessage ?: "Unknown error occurred"}"
                }
            } finally {
                _isLoading.value = false
            }
        }
    }
    fun clearError() {
        _error.value = null
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(viewModel: ChatViewModel) {
    val messages by viewModel.messages.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    
    var messageText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text(
                            "💜 Milla Rayne",
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "Your AI Companion",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White
                )
            )
        },
        bottomBar = {
            Surface(
                shadowElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        modifier = Modifier
                            .weight(1f)
                            .padding(end = 8.dp),
                        placeholder = { Text("Type a message…") },
                        enabled = !isLoading,
                        maxLines = 3
                    )
                    IconButton(
                        onClick = {
                            if (messageText.isNotBlank()) {
                                viewModel.sendMessage(messageText)
                                messageText = ""
                            }
                        },
                        enabled = !isLoading && messageText.isNotBlank()
                    ) {
                        Icon(
                            Icons.Filled.Send,
                            contentDescription = "Send",
                            tint = if (messageText.isNotBlank()) 
                                MaterialTheme.colorScheme.primary 
                            else 
                                Color.Gray
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFFF3E5F5),
                            Color(0xFFE1BEE7)
                        )
                    )
                )
                .padding(paddingValues)
        ) {
            if (messages.isEmpty() && !isLoading) {
                // Empty state
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        "👋 Hello!",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Start chatting with Milla",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color.Gray
                    )
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(8.dp)
                ) {
                    items(messages) { message ->
                        MessageBubble(message = message)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    
                    if (isLoading) {
                        item {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(8.dp),
                                horizontalArrangement = Arrangement.Start
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "Milla is thinking...",
                                    color = Color.Gray,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            }

            // Error snackbar
            error?.let { errorMessage ->
                Snackbar(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    action = {
                        TextButton(onClick = { viewModel.clearError() }) {
                            Text("Dismiss")
                        }
                    }
                ) {
                    Text(errorMessage)
                }
            }
        }
    }
}

@Composable
fun MessageBubble(message: Message) {
    val isUser = message.role == "user"
    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = if (isUser) UserBubble else AssistantBubble,
            shadowElevation = 2.dp,
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Column(
                modifier = Modifier.padding(12.dp)
            ) {
                Text(
                    text = message.content,
                    color = Color.White,
                    style = MaterialTheme.typography.bodyLarge
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = timeFormat.format(Date(message.timestamp)),
                    color = Color.White.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}
