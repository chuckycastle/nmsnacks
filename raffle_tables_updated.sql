-- Create raffles table
CREATE TABLE IF NOT EXISTS raffles (
    raffle_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL
);

-- Create raffle_items table to track categories included in each raffle
CREATE TABLE IF NOT EXISTS raffle_items (
    raffle_item_id INT AUTO_INCREMENT PRIMARY KEY,
    raffle_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (raffle_id) REFERENCES raffles(raffle_id) ON DELETE CASCADE
);

-- Create raffle_tickets table to track ticket sales
CREATE TABLE IF NOT EXISTS raffle_tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    raffle_id INT NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    contact_info VARCHAR(255),
    ticket_number VARCHAR(50) NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status ENUM('Paid', 'Not Paid') NOT NULL DEFAULT 'Paid',
    seller VARCHAR(50) NOT NULL,
    notes TEXT,
    FOREIGN KEY (raffle_id) REFERENCES raffles(raffle_id) ON DELETE CASCADE
);

-- Indexes are automatically created by foreign key constraints
-- No need to explicitly create them