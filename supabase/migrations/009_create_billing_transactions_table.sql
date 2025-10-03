-- Billing transactions table: Payment history (payments, refunds)
CREATE TABLE billing_transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id uuid NOT NULL,
    paystack_transaction_id varchar(255) NOT NULL UNIQUE,
    amount numeric(10,2) NOT NULL,
    currency varchar(3) NOT NULL DEFAULT 'ZAR',
    transaction_type varchar(20) NOT NULL CHECK (transaction_type IN ('charge', 'refund', 'chargeback')),
    status varchar(20) NOT NULL CHECK (status IN ('pending', 'successful', 'failed', 'refunded')),
    transaction_date timestamptz NOT NULL DEFAULT now(),
    receipt_url text,
    error_message text,
    metadata jsonb NOT NULL DEFAULT '{}',
    CONSTRAINT fk_billing_transactions_subscription FOREIGN KEY (subscription_id) 
        REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_billing_transactions_subscription ON billing_transactions(subscription_id);
CREATE INDEX idx_billing_transactions_date ON billing_transactions(transaction_date);
CREATE INDEX idx_billing_transactions_status ON billing_transactions(status);

COMMENT ON TABLE billing_transactions IS 'Stores billing history with Paystack references';
COMMENT ON COLUMN billing_transactions.metadata IS 'Additional transaction details from Paystack';
