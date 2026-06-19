import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yapgcxefevecaleetkxm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcGdjeGVmZXZlY2FsZWV0a3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTYyMjQsImV4cCI6MjA5NjQ5MjIyNH0.h9AAVJ0kCpU_SEaUcqJBV_MtD1i5Vf0qkirLggR__KY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
