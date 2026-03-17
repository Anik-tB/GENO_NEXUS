import { assertDatabase } from "@/lib/db";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}

interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}

function mapUser(row: Record<string, string>): AuthUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    passwordHash: row.password_hash
  };
}

export async function findUserByEmail(email: string) {
  const client = assertDatabase();
  const result = await client.query(
    `
      SELECT id, first_name, last_name, email, password_hash
      FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function createUser(input: CreateUserInput) {
  const client = assertDatabase();
  const result = await client.query(
    `
      INSERT INTO users (
        first_name,
        last_name,
        email,
        password_hash,
        terms_accepted_at,
        medical_acknowledged_at
      )
      VALUES ($1, $2, lower($3), $4, NOW(), NOW())
      RETURNING id, first_name, last_name, email, password_hash
    `,
    [input.firstName, input.lastName, input.email, input.passwordHash]
  );

  return mapUser(result.rows[0]);
}

