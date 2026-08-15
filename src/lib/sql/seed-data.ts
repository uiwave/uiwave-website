export const SEED_SQL = `
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL,
  country TEXT NOT NULL
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id)
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  total REAL NOT NULL,
  order_date TEXT NOT NULL
);

INSERT INTO categories (id, name) VALUES
  (1, 'Bebidas'),
  (2, 'Snacks'),
  (3, 'Lácteos'),
  (4, 'Frutas'),
  (5, 'Panadería'),
  (6, 'Congelados');

INSERT INTO users (id, name, email, age, country) VALUES
  (1, 'Laura Gómez', 'laura@example.com', 28, 'MX'),
  (2, 'Carlos Pérez', 'carlos@example.com', 34, 'AR'),
  (3, 'Ana Ruiz', 'ana@example.com', 22, 'MX'),
  (4, 'Luis Torres', 'luis@example.com', 41, 'CO'),
  (5, 'María López', 'maria@example.com', 25, 'ES'),
  (6, 'Pedro Sánchez', 'pedro@example.com', 19, 'MX'),
  (7, 'Sofía Ramírez', 'sofia@example.com', 30, 'PE'),
  (8, 'Diego Castro', 'diego@example.com', 37, 'CL'),
  (9, 'Valentina Díaz', 'valentina@example.com', 24, 'AR'),
  (10, 'Javier Molina', 'javier@example.com', 45, 'MX');

INSERT INTO products (id, name, price, stock, category_id) VALUES
  (1, 'Refresco cola 600ml', 18.5, 120, 1),
  (2, 'Agua mineral 1L', 12.0, 200, 1),
  (3, 'Jugo de naranja 1L', 25.0, 80, 1),
  (4, 'Papas fritas 150g', 22.5, 90, 2),
  (5, 'Palomitas de queso', 15.0, 60, 2),
  (6, 'Leche entera 1L', 21.0, 150, 3),
  (7, 'Yogurt natural 500g', 28.5, 45, 3),
  (8, 'Queso manchego 400g', 55.0, 30, 3),
  (9, 'Manzanas 1kg', 35.0, 75, 4),
  (10, 'Plátanos 1kg', 18.0, 100, 4),
  (11, 'Pan baguette', 16.5, 40, 5),
  (12, 'Pizza congelada', 75.0, 25, 6);

INSERT INTO orders (id, user_id, product_id, quantity, total, order_date) VALUES
  (1, 1, 1, 2, 37.0, '2024-01-05'),
  (2, 1, 9, 1, 35.0, '2024-01-05'),
  (3, 2, 6, 3, 63.0, '2024-01-08'),
  (4, 3, 4, 1, 22.5, '2024-01-10'),
  (5, 3, 12, 1, 75.0, '2024-01-10'),
  (6, 4, 2, 6, 72.0, '2024-01-12'),
  (7, 5, 7, 2, 57.0, '2024-01-15'),
  (8, 5, 11, 4, 66.0, '2024-01-15'),
  (9, 6, 5, 2, 30.0, '2024-01-18'),
  (10, 7, 3, 1, 25.0, '2024-01-20'),
  (11, 8, 8, 2, 110.0, '2024-01-22'),
  (12, 9, 10, 3, 54.0, '2024-01-25'),
  (13, 10, 1, 4, 74.0, '2024-01-27'),
  (14, 2, 12, 1, 75.0, '2024-01-29'),
  (15, 6, 9, 2, 70.0, '2024-02-02'),
  (16, 1, 4, 3, 67.5, '2024-02-03');
`;

export const PLAYGROUND_DEFAULT_SQL = `-- Explora los datos de ejemplo
SELECT u.name, u.age, u.country
FROM users u
ORDER BY u.age DESC
LIMIT 5;
`;

export const SEED_TABLES = [
  { name: 'categories', description: 'Categorías de productos' },
  { name: 'users', description: 'Usuarios de la plataforma' },
  { name: 'products', description: 'Productos del catálogo' },
  { name: 'orders', description: 'Pedidos realizados' },
] as const;