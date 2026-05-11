import bcrypt from 'bcryptjs';

const hash = '$2b$10$ne9fCY8MtMudJkAjv8D7QOYb.4cElivB6ursawwDH6MYbpEeJWWMoG';
bcrypt.compare('admin123', hash).then(res => console.log('Match:', res));
