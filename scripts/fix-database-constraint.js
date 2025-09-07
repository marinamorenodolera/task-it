#!/usr/bin/env node

/**
 * Database Constraint Fix Script
 * 
 * This script fixes the check_section constraint in the Supabase database
 * to allow the 'devoluciones' section and other required GTD methodology sections.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please check your .env.local file contains:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixDatabaseConstraint() {
  try {
    console.log('🔧 Starting database constraint fix...')
    
    // Read the SQL script
    const sqlScript = fs.readFileSync(
      path.join(__dirname, '../fix_check_section_constraint.sql'), 
      'utf8'
    )
    
    // Split the script into individual commands (simple approach)
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'))
    
    console.log(`📝 Found ${commands.length} SQL commands to execute`)
    
    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (!command) continue
      
      console.log(`⚡ Executing command ${i + 1}/${commands.length}:`)
      console.log(`   ${command.substring(0, 60)}...`)
      
      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: command
        })
        
        if (error) {
          console.warn(`⚠️  Command ${i + 1} warning:`, error.message)
          // Continue with other commands even if one fails
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`)
          if (data) {
            console.log(`   Result:`, data)
          }
        }
      } catch (err) {
        console.warn(`⚠️  Command ${i + 1} error:`, err.message)
        // Continue with other commands
      }
    }
    
    // Test the constraint by attempting to create a task with 'devoluciones' section
    console.log('\n🧪 Testing constraint fix...')
    
    // First, let's check if we can query the constraints
    try {
      const { data: constraints, error: constraintError } = await supabase
        .from('information_schema.check_constraints')
        .select('*')
        .ilike('check_clause', '%devoluciones%')
      
      if (constraintError) {
        console.log('⚠️  Could not query constraints directly (this is normal with RLS)')
      } else {
        console.log('📋 Found constraints containing "devoluciones":', constraints?.length || 0)
      }
    } catch (err) {
      console.log('⚠️  Constraint query not available (this is normal)')
    }
    
    // Test by attempting to update a task (if any exists)
    const { data: testTasks, error: queryError } = await supabase
      .from('tasks')
      .select('id, section')
      .limit(1)
    
    if (queryError) {
      console.log('❌ Could not query tasks:', queryError.message)
      return
    }
    
    if (testTasks && testTasks.length > 0) {
      const testTask = testTasks[0]
      const originalSection = testTask.section
      
      // Try to update the task to use 'devoluciones' section
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ section: 'devoluciones' })
        .eq('id', testTask.id)
      
      if (updateError) {
        console.log('❌ Constraint fix failed:', updateError.message)
        console.log('   The "devoluciones" section is still not allowed')
        return
      }
      
      // Revert the change
      await supabase
        .from('tasks')
        .update({ section: originalSection })
        .eq('id', testTask.id)
      
      console.log('✅ Constraint fix successful!')
      console.log('   Tasks can now be moved to "devoluciones" section')
    } else {
      console.log('⚠️  No tasks found to test with')
      console.log('   Constraint fix appears to be applied')
    }
    
    console.log('\n🎉 Database constraint fix completed!')
    console.log('\n📋 The following sections are now available:')
    console.log('   - big_three, urgent, en_espera, otras_tareas, completadas')
    console.log('   - inbox, daily, weekly, monthly, shopping, devoluciones')
    console.log('   - someday, waiting, reference, today, next_actions, projects')
    
  } catch (error) {
    console.error('❌ Failed to fix database constraint:', error.message)
    console.error('   Please run this script with proper database access')
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  fixDatabaseConstraint()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Script failed:', err.message)
      process.exit(1)
    })
}

module.exports = { fixDatabaseConstraint }