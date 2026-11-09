
require('dotenv').config();


const express = require('express');

const path = require("path");
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const app = express();

const pool = require('./db');
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//authenttiaction session configuration

app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    name: 'fitfusion.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000* 60* 60* 24
    }
}));


function requirePageLogin(req, res, next) {
    if(!req.session || !req.session.userId) {
        return res.redirect('/login.html');
    }
    next();
}


function requireLogin(req, res, next){
    if(!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Please login first.'
        });

        
    }
    next();
}

app.get(['/', '/index.html'], requirePageLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public',  'index.html'));
});

app.use(express.static(path.join(__dirname, 'public'),{
    index: false
}));

// Test backend API
//app.get('/api/test', (req, res) => {
   // res.json({
    //    message: "FitFusion backend is working!"
    //});
//});

let users = [
    {


        
    "id": 1,
    "age": 21,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "activity": "moderate",
    "goal": "gain",
    "diet": "non-vegetarian",
    "budget": "medium",
    "workoutDays": 4
},
{
    "id":2,
    "age": 22,
    "gender": "male",
    "height": 174,
    "weight": 64,
    "activity": "moderate",
    "goal": "gain",
    "diet": "non-vegetarian",
    "budget": "low",
    "workoutDays": 6
},
{
    "id":3,
    "age": 26,
    "gender": "female",
    "height": 164,
    "weight": 70,
    "activity": "moderate",
    "goal": "lose",
    "diet": "vegetarian",
    "budget": "medium",
    "workoutDays": 5
},

];


app.get('/api/users',requireLogin, async (req, res) => {
    try {
       
            


        const result = await pool.query('SELECT * FROM users WHERE account_id = $1',
            [req.session.userId]
        );
        res.json(result.rows);
    }
    catch(error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            message: 'Database error',
            error: error.message
        });
    }
});




app.get('/api/users/:id' , requireLogin , async (req , res) => {
    try{
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

   const result = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND ACCOUNT_id =$2',
    [id, req.session.userId]
   );

    if(result.rows.length === 0) {
        return res.status(404).json({
            message: " User not found"
        })
    }
    res.json(result.rows[0]);
} 
catch (error) {
    console.log('Error fetching user:', error);
    res.status(500).json({
        message: 'Database error'
    });
}
});

app.post('/api/users', requireLogin, async (req, res) => {
    try{
        
    const  {
    
        age,
        gender,
        height,
        weight,
        activity,
        goal,
        diet,
        budget,
        workoutDays 
    } = req.body;
    
    const result = await pool.query(
        `INSERT INTO users
        (account_id, age, gender, height, weight, activity, goal, diet, budget, workout_days)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *`,
        [
            req.session.userId,
            age,
            gender,
            height,
            weight,
            activity,
            goal,
            diet,
            budget,
            workoutDays
        ]
    );

    res.status(201).json(result.rows[0]);
}
catch (error) {
    if(error.code === '23505') {
        return res.status(409).json({
            message: 'you already have a fitness profile'
        });
    }
   console.error('Error creating profile:', error);
res.status(500).json({ 
    message: 'Database error' 
});
}

});
 
app.get('/api/users/:id/full-plan', requireLogin, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id<= 0) {
            return res.status(400).json({
                message: 'Inavlid user ID'
            });
        }
        
        const result = await pool.query(
       `SELECT 
            u.id,
            u.age,
            u.gender,
            u.height,
            u.weight,
            u.activity,
            u.goal,
            u.diet,
            u.budget,
            u.workout_days,
            fp.id AS plan_id,
            fp.bmi,
            fp.bmr,
            fp.tdee,
            fp.target_calories,
            fp.protein,
            fp.carbs,
            fp.fat,
            fp.created_at AS plan_created_at
            
        from users u
        LEFT JOIN fitness_plans fp
        ON u.id = fp.user_id
        WHERE u.id =$1
        AND u.account_id = $2
        ORDER BY fp.created_at DESC
        LIMIT 1`,
        [id, req.session.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'fitness profile or plan not found'
            });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.log('error fetching full plan:', error);

        res.status(500).json({
            message: 'Database error'
        });
    }
});

  
app.put('/api/users/:id', requireLogin, async (req, res) => {
    try {

    const id = Number(req.params.id);

    if(!Number.isInteger(id) || id<= 0) {
        return res.status(400).json({
            message: 'Inavlid user ID'
        });
    }
    const {
    
        age,
        gender,
        height,
        weight,
        activity,
        goal,
        diet,
        budget,
        workoutDays
    } = req.body;

    const result = await pool.query(
        `UPDATE users
        SET age =$1,
            gender =$2,
            height =$3,
            weight = $4,
            activity =$5,
            goal =$6,
            diet =$7,
            budget =$8,
            workout_days =$9
            WHERE id =$10
            AND account_id = $11
            RETURNING *`,
            [
                age,
                gender,
                height,
                weight,
                activity,
                goal,
                diet,
                budget,
                workoutDays,
                id,
                req.session.userId

            ]
    );
    
    if(result.rows.length === 0) {
        return res.status(404).json({
            message: 'Fitness profile not found'
        });
    }

    res.json(result.rows[0]);
}
catch (error) {
    console.log('Error upadting user:', error);

    res.status(500).json({
        message: 'Database error'
    });
}
});
app.delete('/api/users/:id', requireLogin,  async (req, res) => {
    try{

    const id = Number(req.params.id);

    if(!Number.isInteger(id) || id<= 0) {
        return res.status(400).json({
            message: 'Invalid user ID'
        });
    }
    const result = await pool.query(
        'DELETE FROM users WHERE id =$1 AND account_id = $2 RETURNING id',
        [id, req.session.userId]
    );
    console.log("deletd rows:", result.rows);
    if(result.rows.length === 0) {
        return res.status(404).json({
            message:"Fitness profile not found"
        });
    }
   
    res.json({
        message: "fitness profile deleted successfully"
    });
}
catch (error) {
    console.error('Error deleting user:', error);

    res.status(500).json({
        message: 'Database error'
    });
}
});

app.post('/api/fitness-plans', requireLogin, async (req, res) => {
    try{
        const {
            userId,
            bmi,
            bmr,
            tdee,
            targetCalories,
            protein,
            carbs,
            fat
        } = req.body;
         const id = Number(userId);

         if(!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Inavlid fitness profile ID'
            });
         }
        console.log("running fitness plan INSERT...");
      

        const ownership = await pool.query(
            `SELECT id
            FROM users
            WHERE id =$1
              AND account_id = $2`,
              [id, req.session.userId]
        );

        if(ownership.rows.length === 0) {
            return res.status(404).json({
                message: 'Fitness profile not found'
            });
        }
        const result = await pool.query(
            `INSERT INTO fitness_plans
            (user_id, bmi, bmr, tdee, target_calories, protein, carbs, fat)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                id,
                bmi,
                bmr,
                tdee,
                targetCalories,
                protein,
                carbs,
                fat
            ]
        );
        res.status(201).json(result.rows[0]);

    }
    catch (error) {
        console.error('Error creating fitness plan:', error);
        res.status(500).json({
            message: 'database error'
        });
    }
});

app.get('/api/fitness-plans/:userId', requireLogin, async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if(!Number.isInteger(userId) || id <= 0) {
            return res.status(400).json({
                message: 'Inavlid fitness profile ID'
            });
        }

        const result = await pool.query(
            `SELECT fp.*
            FROM fitness_plans fp
            JOIN users u ON u.id = fp.user_id
            WHERE fp.user_id = $1
            AND u.account_id = $2
            ORDER BY fp.created_at DESC`,
            [userId, req.session.userId]
        );
        if(result.rows.length === 0){
            return res.status(404).json({
                message: 'Fitness plan not found'
            });
        }
        res.json(result.rows);
    }
    catch (error) {
        console.error('error fetching fitness plan:', error);

        res.status(500).json({
           message: 'database error'
        })  
      }
});

app.get('/api/stats/goals', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                goal,
                COUNT(*) AS total_users,
                ROUND(AVG(weight), 2) AS average_weight,
                ROUND(AVG(activity), 2) AS average_activity
            FROM users
            GROUP BY goal
            WHERE account_id = $1
            ORDER BY total_users DESC`,
            [req.session.userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching goal statistics:', error);

        res.status(500).json({
            message: 'Database error'
        });
    }
});

 
app.get('/api/stats/overview', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
             count(DISTINCT u.id) AS total_users,
             ROUND(AVG(u.weight), 2) AS average_weight,
             MAX(u.weight) AS highest_weight,
             MIN(u.weight) AS lowest_weight,
             ROUND(AVG(fp.bmi), 2) AS average_bmi,
             ROUND(AVG(fp.target_calories), 2) AS average_target_calories
            FROM users u
            LEFT JOIN fitness_plans fp
            ON u.id = fp.user_id
            WHERE u.account_id = $1`,
        [req.session.userId]
        );
             res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching overview statistics:', error);

        res.status(500).json({
            message: 'database error'
        });
    }
});   

 app.post('/api/create-user-plan', requireLogin, async (req, res) => {
    let client;
    let transactionStarted = false;
    try {
        

        const {
            age,
            gender,
            height,
            weight,
            activity,
            goal,
            diet,
            budget,
            workoutDays,

            bmi,
            bmr,
            tdee,
            targetCalories,
            carbs,
            protein,
            fat
        } = req.body;


         const client = await pool.connect();
         await client.query('BEGIN');
         transactionStarted = true;

        const userResult = await client.query(
            `INSERT INTO users
            (account_id, age, gender, height, weight, activity, goal, diet, budget, workout_days)
            VALUES ($1, $2, $3, $4, $5, $6,$7, $8, $9, $10)
            RETURNING *`,
            [
                req.session.userId,
                age,
                gender,
                height,
                weight,
                activity,
                goal,
                diet,
                budget,
                workoutDays
            ]
        );

        const user = userResult.rows[0];

        const planResult = await client.query(
            `INSERT INTO fitness_plans
            (user_id, bmi, bmr, tdee, target_calories, protein, carbs, fat)
            VALUES ($1, $2, $3, $4, $5,$6, $7, $8)
            RETURNING *`,
            [
                user.id,
                bmi,
                bmr,
                tdee,
                targetCalories,
                protein,
                carbs,
                fat
            ]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Fitness profile and plan created successfully',
            user: user,
            fitnessPlan: planResult.rows[0]
        });
    }
    catch (error) {
        if(client && transactionStarted) {
            try {
                  await client.query('ROLLBACK');
                  transactionStarted =false;
            } catch (rollbackError) {
                console.error('Transaction roolback failed:', rollbackError)
            }
        }
       if(error.code === '23505') {
        return res.status(409).json({
            message: 'A fitness profile already exists for this account.'
        });
       }
        
        console.error('Error creating profile and fitness plan:', error);

        res.status(500).json({
            message:'could not create fitness profile and plan'
        });
    }
    finally {
        if (client) {
            client.release();
        }
        
    }
});
 


 app.get('/api/stats/bmi', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.id,
                u.goal,
                fp.bmi,
                CASE
                WHEN fp.bmi < 18.5 THEN 'underweight'
                WHEN fp.bmi < 25 THEN 'normal'
                WHEN fp.bmi < 30 THEN 'overweight'
                ELSE 'obese'
                END AS bmi_category
            FROM users u
            LEFT JOIN fitness_plans fp
            ON u.id = fp.user_id
            WHERE u.account_id =$1
            ORDER BY fp.bmi;
            `,[req.session.userId]
        );

            res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching BMI statistics:', error);

        res.status(500).json({
            message: 'Database error'
        });
    }
 });

 //register
 app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if(
            typeof fullName !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !fullName.trim() ||
            !email.trim() ||
            password.length < 8 ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            return res.status(400).json({
                message: 'Enter your name, a valid email, and a password of 8-72 bytes.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                message: 'Enter a valid email address.'
            });
        }

        const existing = await pool.query(
            'SELECT id FROM app_accounts WHERE email = $1',
            [normalizedEmail]
        );

        if(existing.rows.length > 0) {
            return res.status(409).json({
                message: 'An account with this email already exists. Please log in or use a different email address.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO public.app_accounts (full_name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, full_name, email, created_at`,
            [fullName.trim(), normalizedEmail, passwordHash]
        );

        res.status(201).json({
            message: 'Registration successful. you can now log in.',
            user: result.rows[0]
        });
    }
    catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: ' An account with this email already exists.'
            });
        }

        console.error ("Registration error:", error);

        res.status(500).json({
            message: 'Could not register your account.'
        });
    }
 });

 //login
 app.post('/api/auth/login', async (req, res) => {
    try {
        const  { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            return res.status(400).json({
                message: 'Enter your email and password.'
            });
        }

        const result = await pool.query(
            `SELECT id, full_name, email, password_hash
            FROM app_accounts
            WHERE email =$1`,
            [email.trim().toLowerCase()]
        );
        const account = result.rows[0];

        if(
            !account ||
            !(await bcrypt.compare(password, account.password_hash))
        ) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }
        req.session.regenerate((error) => {
            if(error) {
                console.error('Session error:', error);
                return res.status(500).json({
                    message: 'Could not create your session. please try again.'
                });
            }
            req.session.userId = account.id;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error('Session save error:', saveError);
                    return res.status(500).json({
                        message: 'Could not save your session. please try again.'
                    });
                }

            res.json({
                message: 'Login successful.',
                user: {
                    id: account.id,
                    fullName: account.full_name,
                    email: account.email
                }
            });
            });
        });
    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            message: 'Could not log in.'
        });
    }
 
 });

 app.get('/api/auth/me', async (req, res) => {
    if(!req.session || !req.session.userId) {
        return res.status(401).json({
            loggedIn: false,
            message: 'You are not logged in.'
        });
    }
    try {
        const result = await pool.query(
            `SELECT id, full_name, email
            FROM app_accounts
            WHERE id = $1`,
            [req.session.userId]
        );
        if(result.rows.length === 0) {
            return req.session.destroy((error) => {

                if (error) {
                    console.error('Session destroy error:', error);
                }

                res.clearCookie('fitfusion.sid', {
                    httpOnly: true,
                    secure:process.env.NODE_ENV === 'production',
                    sameSite:'lax',
                
                    path: '/'
                });

                res.status(401).json({
                    loggedIn: false,
                    message: 'Account not found.'
                });
            });
        }

        const account = result.rows[0];
        return res.json({ 
            loggedIn: true,
            user:{
                id: account.id,
                fullName: account.full_name,
                email: account.email    
                }
         });
    }
    catch (error) {
        console.error('session check error:', error);

        res.status(500).json({
            message: 'Could not verify your session.'
        });
    }
 });

 //logout
 app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((error) => {
        if(error) {
            console.error('Logout error:', error);

            return res.status(500).json({
                message: 'could not log out.'
            });
        }

        res.clearCookie('fitfusion.sid', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        res.json({
            message: 'Logged out successfully.'
        });
    });
 });



app.listen(port, () => {
    console.log(`FITFUSION is  running on http://localhost:${port}`);
});