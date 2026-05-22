-- Table de base (cours)
CREATE TABLE products (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100),
  about VARCHAR(500),
  price FLOAT
);

INSERT INTO products (name, about, price) VALUES
  ('My first game', 'This is an awesome game', '60');

-- Exercice 1 : Ressource Users
CREATE TABLE users (
  id       SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email    VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- Exercice 4 : Système de panier (Orders)
CREATE TABLE orders (
  id         SERIAL PRIMARY KEY,
  user_id    INT     NOT NULL REFERENCES users(id),
  total      FLOAT   NOT NULL DEFAULT 0,
  payment    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_products (
  order_id   INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  PRIMARY KEY (order_id, product_id)
);

-- Exercice 5 : Système d'avis (Reviews)
ALTER TABLE products ADD COLUMN avg_score FLOAT DEFAULT 0;

CREATE TABLE reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INT  NOT NULL REFERENCES users(id),
  product_id INT  NOT NULL REFERENCES products(id),
  score      INT  NOT NULL CHECK (score >= 1 AND score <= 5),
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
