import { createClient } from '@supabase/supabase-js';
import { env } from '../config.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ogxgavevjsnfhipsmojm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_kcXudz3ih_6R9enu7MmIpQ_0t77YjGT';

export const supabase = createClient(supabaseUrl, supabaseKey);
