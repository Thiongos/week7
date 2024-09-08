SELECT user, host FROM mysql.user WHERE user = 'root';

GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY 'Welcome@2021' WITH GRANT OPTION;
FLUSH PRIVILEGES;


