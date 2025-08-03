CREATE TABLE journal_entries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATETIME NOT NULL,
    account_id INT NOT NULL,
    type ENUM('debit', 'credit') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
