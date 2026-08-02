import { createClient } from '@insforge/sdk';

const insforge = createClient(
  "https://ghvkv8xw.eu-central.insforge.app",
  "ik_f5779f9a95f98212dc699b8a4956a494"
);

async function createAdmin() {
  const { data, error } = await insforge.auth.signUp({
    email: 'admin@nigelec.ne',
    password: 'admin123',
    options: {
      data: { name: 'Administrateur', role: 'admin' }
    }
  });

  if (error) {
    console.error('Erreur:', error.message);
  } else {
    console.log('Succès:', data.user.email);
  }
}

createAdmin();
