mysql \
  --user="root" \
  --password="${MYSQL_ROOT_PASSWORD}" \
  --database="${MYSQL_DATABASE}" \
  --execute="CREATE USER '${MYSQL_USER}'@ IDENTIFIED BY '${MYSQL_PASSWORD}';"

mysql \
  --user="root" \
  --password="${MYSQL_ROOT_PASSWORD}" \
  --database="${MYSQL_DATABASE}" \
  --execute="GRANT ALL PRIVILEGES ON * . * TO '${MYSQL_USER}'@;"

mysql \
  --user="root" \
  --password="${MYSQL_ROOT_PASSWORD}" \
  --database="${MYSQL_DATABASE}" \
  --execute="FLUSH PRIVILEGES;"
