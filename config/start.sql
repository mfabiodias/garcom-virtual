-- CREATE SCHEMA gestor_virtual2;
-- DROP SCHEMA gestor_virtual;


SELECT * FROM `category`;
SELECT * FROM `product`;
SELECT * FROM `client`;
SELECT * FROM `employee`;
SELECT * FROM `order`;
SELECT * FROM `mailing`;
SELECT * FROM `campaign`;
SELECT * FROM `whatsapp`;
SELECT * FROM `message`;

SELECT * FROM `product` WHERE category_id = 4;


INSERT INTO `category` (id, name, description) VALUES 
(1, 'Pratos Gerais', 'Categoria de refeições disponiveis'),
(2, 'Bebidas', 'Bebidas disponiveis'),
(3, 'Porções', 'Porções disponiveis');


INSERT INTO `product` (id, category_id, name, description, price, featured) VALUES 
(1, 1, 'Bife Grelhado', 'Arroz, Feijão e Salada', 17.99, 0),
(2, 1, 'Bife Acebolado', 'Arroz, Feijão e Salada', 18, 1),
(3, 1, 'Bife a Cavalo', 'Arroz, Feijão e Salada', 18, 0),
(4, 1, 'Bife a Milanesa', 'Arroz, Feijão e Salada', 19, 0),
(5, 1, 'File de Frango a Cavalo', 'Arroz, Feijão e Salada', 18, 0),
(6, 1, 'File de Frango a Parmegiana', 'Arroz, Feijão e Salada', 21, 0),
(7, 1, 'Bisteca a Cavalo', 'Arroz, Feijão e Salada', 18, 0),
(8, 1, 'Linguiça Toscana Acebolada', 'Arroz, Feijão e Salada', 18, 0),
(9, 1, 'Calabresa Acebolada com Queijo Mussarela e Oregano', 'Arroz, Feijão e Salada', 19, 0),
(10, 1, 'Peixe a Parmegiana', 'Arroz, Feijão e Salada', 21, 0),
(11, 3, 'Salada Grande', 'Porção de Salada Grande', 8, 0),
(12, 3, 'Batata Frita', 'Porção de Batata Frita', 14, 0),
(13, 3, 'Batata Frita Especial C/Bacon e Mussarela', 'Porção de Batata Frita C/Bacon e Mussarela', 21, 0),
(14, 3, 'Calabresa Acebolada', 'Porção de Calabresa Acebolada', 21, 0),
(15, 3, 'Isca de Bife Acebolado', 'Porção de Isca de Bife Acebolado', 37, 0),
(16, 3, 'Mandioca Frita', 'Porção de Mandioca Frita', 19, 0),
(17, 3, 'Feijão Grande', 'Porção de Feijão Grande', 12, 0),
(18, 2, 'Refrigerante 1.5L', '', 9, 0),
(19, 2, 'H2O 500ml', '', 6, 0),
(20, 2, 'Refrigerante Lata', '', 5, 0),
(21, 2, 'Água S/Gás', '', 2.5, 0);

INSERT INTO `client` (id, name, mobile) VALUES 
(1, 'Fabio Dias', '11931454949'),
(2, 'Japa Festeira', '11931455757'),
(3, 'Talita', '11931455701'),
(4, 'Gustavo', '11931433757'),
(5, 'Guilherme', '11931454557'),
(6, 'Victor', '11931455527'),
(7, 'Isabela', '11931455127'),
(8, 'Dudsa', '11931455123');

INSERT INTO `employee` (id, name, mobile, phone) VALUES 
(1, 'Juca', '11931458080','1124518090'),
(2, 'Pereira', '11931456262','');

INSERT INTO `order` (id, client_id, employee_id, items, delivery, discount, origin) VALUES
(1, 1, 1, '[{"id":1,"qty":2,"price":17.99},{"id":20,"qty":2,"price":5},{"id":13,"qty":1,"price":21}]',2,0,'whatsapp'),
(2, 1, 1, '[{"id":1,"qty":2,"price":17.99},{"id":20,"qty":2,"price":5}]',5,0,'site'),
(3, 2, NULL, '[{"id":1,"qty":1,"price":18},{"id":20,"qty":1,"price":5},{"id":13,"qty":1,"price":21}]',0,0,'garçom'),
(4, 2, 2, '[{"id":2,"qty":1,"price":17.99},{"id":20,"qty":1,"price":5},{"id":13,"qty":1,"price":21}]',8,5,'whatsapp');

INSERT INTO `mailing` (id, name, description, type, client_list) VALUES 
(1, 'Todos', 'Todos os cliente', 'all', NULL),
(2, 'Melhores Clientes', 'Enviar somente para os melhores clientes', 'selected', '[1,2,3,5,8]'),
(3, 'Maior Consumo', 'Para clientes recorrentes', 'selected', '[2,5,8]');

INSERT INTO `campaign` (id, mailing_id, name, message, schedule_date, schedule_time, schedule_day, recurrent) VALUES 
(1, 1, 'Todos os Cliente Feijoada', 'Saborosa Feijoada...', NULL, '11:00', 2, 1),
(2, 2, 'Clientes Locais', 'Fidelizar Clienters...', '2020-06-29', '10:00', -1, 0);

INSERT INTO `whatsapp` () VALUES ();



