ng
Complete
Building
Failed
10:36:54 PM: Netlify Build                                                 
10:36:54 PM: ────────────────────────────────────────────────────────────────
10:36:54 PM: ​
10:36:54 PM: ❯ Version
10:36:54 PM:   @netlify/build 35.11.2
10:36:54 PM: ​
10:36:54 PM: ❯ Flags
10:36:54 PM:   accountId: 69bea65c6f2ab0c9abde4b6f
10:36:54 PM:   baseRelDir: true
10:36:54 PM:   buildId: 69c9a979d380af0008015697
10:36:54 PM:   deployId: 69c9a979d380af0008015699
10:36:55 PM: ​
10:36:55 PM: ❯ Current directory
10:36:55 PM:   /opt/build/repo
10:36:55 PM: ​
10:36:55 PM: ❯ Config file
10:36:55 PM:   /opt/build/repo/netlify.toml
10:36:55 PM: ​
10:36:55 PM: ❯ Context
10:36:55 PM:   production
10:36:55 PM: ​
10:36:55 PM: ❯ Installing extensions
10:36:55 PM:    - neon
10:36:56 PM: ​
10:36:56 PM: ❯ Using Next.js Runtime - v5.15.9
10:36:56 PM: ​
10:36:56 PM: ❯ Loading plugins
10:36:56 PM:    - @netlify/plugin-emails@1.1.1 from Netlify app
10:36:56 PM: ​
10:36:56 PM: ❯ Loading extensions
10:36:56 PM:    - neon
10:36:59 PM: Next.js cache restored
10:36:59 PM: ​
10:36:59 PM: build.command from netlify.toml                               
10:36:59 PM: ────────────────────────────────────────────────────────────────
10:36:59 PM: ​
10:36:59 PM: $ npm run build
10:36:59 PM: > dropzi@1.0.0 build
10:36:59 PM: > next build
10:37:00 PM:   ▲ Next.js 14.2.0
10:37:00 PM:    Creating an optimized production build ...
10:37:07 PM:  ✓ Compiled successfully
10:37:07 PM:    Linting and checking validity of types ...
10:37:13 PM: Failed to compile.
10:37:13 PM: 
10:37:13 PM: ./src/app/dashboard/parametres/page.tsx:65:72
10:37:13 PM: Type error: Cannot find name 'profil'.
10:37:13 PM:   63 |         <div className="flex items-center justify-between mb-2">
10:37:13 PM:   64 |           <span className="text-sm text-gray-600">Plan actuel</span>
10:37:13 PM: > 65 |           <span className={`text-xs font-bold px-3 py-1 rounded-full ${profil.plan === 'elite' ? 'bg-green-100 text-green-700' : profil.plan === 'business' ? 'bg-[#EEEDFE] text-[#534AB7]' : profil.plan === 'starter' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
10:37:13 PM:      |                                                                        ^
10:37:13 PM:   66 |               {profil.plan ? profil.plan.toUpperCase() : 'AUCUN'}
10:37:13 PM:   67 |             </span>
10:37:13 PM:   68 |         </div>
10:37:14 PM: Failed during stage 'building site': Build script returned non-zero exit code: 2 (https://ntl.fyi/exit-code-2)
10:37:14 PM: ​
10:37:14 PM: "build.command" failed                                        
10:37:14 PM: ────────────────────────────────────────────────────────────────
10:37:14 PM: ​
10:37:14 PM:   Error message
10:37:14 PM:   Command failed with exit code 1: npm run build (https://ntl.fyi/exit-code-1)
10:37:14 PM: ​
10:37:14 PM:   Error location
10:37:14 PM:   In build.command from netlify.toml:
10:37:14 PM:   npm run build
10:37:14 PM: ​
10:37:14 PM:   Resolved config
10:37:14 PM:   build:
10:37:14 PM:     command: npm run build
10:37:14 PM:     commandOrigin: config
10:37:14 PM:     environment:
10:37:14 PM:       - BREVO_API_KEY
10:37:14 PM:       - BREVO_FROM_EMAIL
10:37:14 PM:       - CRON_SECRET
10:37:14 PM:       - NETLIFY_EMAILS_DIRECTORY
10:37:14 PM:       - NETLIFY_EMAILS_SECRET
10:37:14 PM:       - NEXT_PUBLIC_SUPABASE_ANON_KEY
10:37:14 PM:       - NEXT_PUBLIC_SUPABASE_URL
10:37:14 PM:       - PAYDUNYA_MASTER_KEY
10:37:14 PM:       - PAYDUNYA_MODE
10:37:14 PM:       - PAYDUNYA_PRIVATE_KEY
10:37:14 PM:       - PAYDUNYA_PUBLIC_KEY
10:37:14 PM:       - PAYDUNYA_TOKEN
10:37:14 PM:       - SUPABASE_SERVICE_ROLE_KEY
10:37:14 PM:       - NODE_VERSION
10:37:14 PM:     publish: /opt/build/repo/.next
10:37:14 PM:     publishOrigin: config
10:37:14 PM:   plugins:
10:37:14 PM:     - inputs: {}
10:37:14 PM:       origin: ui
10:37:14 PM:       package: "@netlify/plugin-emails"
10:37:14 PM:     - inputs: {}
10:37:14 PM:       origin: config
10:37:14 PM:       package: "@netlify/plugin-nextjs"
10:37:14 PM: Build failed due to a user error: Build script returned non-zero exit code: 2
10:37:14 PM: Failing build: Failed to build site
10:37:15 PM: Finished processing build request in 32.603s
