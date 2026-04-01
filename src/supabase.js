import { createClient } from '@supabase/supabase-js';

// These come from your .env file — you'll set them up in the next step
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─── Database helper functions ───

// Load all clients from Supabase
export async function loadClients() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created', { ascending: false });
  if (error) {
    console.error('Error loading clients:', error);
    return null;
  }
  return data;
}

// Save a new client
export async function addClient(client) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single();
  if (error) {
    console.error('Error adding client:', error);
    return null;
  }
  return data;
}

// Update an existing client
export async function updateClient(id, updates) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Error updating client:', error);
    return null;
  }
  return data;
}

// Delete a client
export async function deleteClient(id) {
  if (!supabase) return null;
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting client:', error);
    return false;
  }
  return true;
}

// Load all policies from Supabase
export async function loadPolicies() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .order('year_issued', { ascending: false });
  if (error) {
    console.error('Error loading policies:', error);
    return null;
  }
  return data;
}

// Load team members
export async function loadTeam() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('team')
    .select('*');
  if (error) {
    console.error('Error loading team:', error);
    return null;
  }
  return data;
}
