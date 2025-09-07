#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
const fs = require('fs')
const path = require('path')

// Read .env.local file
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  const envLines = envFile.split('\n')
  envLines.forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY')
  console.log('Using anon key instead...')
  
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseAnonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY as well')
    process.exit(1)
  }
  
  // Try with anon key (limited permissions)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('Connected with anon key - attempting constraint fix...')
} else {
  // Use service key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  console.log('Connected with service key - full admin access')
}

async function fixConstraint() {
  console.log('🔧 Starting database constraint fix...')
  
  // Create client with available credentials
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // SQL commands to fix the constraint
  const sqlCommands = [
    // Drop existing constraint if exists
    `ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_section;`,
    `ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_section_check;`,
    
    // Create new constraint with all required section values
    `ALTER TABLE tasks ADD CONSTRAINT check_section 
     CHECK (section IN (
       'big_three',
       'urgent', 
       'en_espera',
       'otras_tareas',
       'completadas',
       'inbox',
       'daily',
       'weekly', 
       'monthly',
       'shopping',
       'devoluciones',
       'someday',
       'waiting',
       'reference',
       'today',
       'next_actions',
       'projects'
     ));`
  ]
  
  try {
    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql.substring(0, 50)}...`)
      const { data, error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.error('SQL Error:', error)
        console.log('Attempting direct query instead...')
        
        // Try direct query approach
        const result = await supabase.from('tasks').select('*').limit(1)
        if (result.error) {
          console.error('Connection test failed:', result.error)
        } else {
          console.log('Connection successful, but constraint modification requires admin access')
        }
      } else {
        console.log('✅ Command executed successfully')
      }
    }
    
    // Verify constraint exists
    console.log('🔍 Verifying constraint...')
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: `SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conname = 'check_section';`
    })
    
    if (error) {
      console.log('⚠️  Cannot verify constraint (admin access needed)')
      console.log('The constraint fix requires Supabase admin access or direct SQL execution')
      console.log('Please run the fix_check_section_constraint.sql file in your Supabase SQL editor')
    } else {
      console.log('✅ Constraint verification:', data)
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
    console.log('📝 Manual fix required:')
    console.log('1. Go to your Supabase project dashboard')
    console.log('2. Open the SQL Editor')
    console.log('3. Run the fix_check_section_constraint.sql file')
  }
}

fixConstraint()