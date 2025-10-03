-- Chat messages table: Conversational interface message history
CREATE TABLE chat_messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    sender varchar(10) NOT NULL CHECK (sender IN ('user', 'system')),
    message_text text NOT NULL,
    interpreted_command varchar(100),
    command_parameters jsonb,
    resulting_action text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

COMMENT ON TABLE chat_messages IS 'Stores chat history with command interpretation';
COMMENT ON COLUMN chat_messages.interpreted_command IS 'Extracted command (e.g., generate_posts, show_analytics)';
COMMENT ON COLUMN chat_messages.command_parameters IS 'Parsed parameters (e.g., {count: 5, topic: "product launch"})';
