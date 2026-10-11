const express = require('express');
const app = express();

const pool = require('./db');
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Serve FitFusion frontend
app.use(express.static(path.join(__dirname, 'public')));

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
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    }
    catch(error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            message: 'Database error'
        });
    }
});




app.get('/api/users/:id' , async (req , res) => {
    try{
    const id = parseInt(req.params.id);

   const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
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

app.post('/api/users', async (req, res) => {
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
        (age, gender, height, weight, activity, goal, diet, budget, workout_days)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
            workoutDays
        ]
    );

    res.status(201).json(result.rows[0]);
}
catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
        message: 'Database error'
    });
}
});
 
app.get('/api/users/:id/full-plan', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

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
        JOIN fitness_plans fp
        ON u.id = fp.user_id
        WHERE u.id =$1
        ORDER BY fp.created_at DESC
        LIMIT 1`,
        [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'User or fitness plan not found'
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

  
app.put('/api/users/:id', async (req, res) => {
    try {

    const id = parseInt(req.params.id);
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
            activity =$5
            goal =$6,
            diet =$7,
            budget =$8,
            workout_days =$9
            WHERE id =$10
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
                workoutDays
            ]
    );
    
    if(result.rows.length === 0) {
        return res.status(404).json({
            message: 'User not found'
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
app.delete('/api/users/:id', async (req, res) => {
    try{

    const id = parseInt(req.params.id);
    const result = await pool.query(
        'DELETE FROM users WHERE id =$1 RETURNING *',
        [id]
    );
    console.log("deletd rows:", result.rows);
    if(result.rows.length === 0) {
        return res.status(404).json({
            message:"user not found"
        });
    }
   
    res.json({
        message: "user deleted successfully"
    });
}
catch (error) {
    console.error('Error deleting user:', error);

    res.status(500).json({
        message: 'Database error'
    });
}
});

app.post('/api/fitness-plans', async (req, res) => {
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

        console.log("running fitness plan INSERT...");

        const result = await pool.query(
            `INSERT INTO fitness_plans
            (user_id, bmi, bmr, tdee, target_calories, protein, carbs, fat)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                userId,
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

app.get('/api/fitness-plans/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        const result = await pool.query(
            `SELECT *
            FROM fitness_plans
            WHERE user_id = $1
            ORDER BY created_at DESC`,
            [userId]
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

app.get('/api/stats/goals', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                goal,
                COUNT(*) AS total_users,
                ROUND(AVG(weight), 2) AS average_weight,
                ROUND(AVG(activity), 2) AS average_activity
            FROM users
            GROUP BY goal
            ORDER BY total_users DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching goal statistics:', error);

        res.status(500).json({
            message: 'Database error'
        });
    }
});

 
app.get('/api/stats/overview', async (req, res) => {
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
            JOIN fitness_plans fp
            ON u.id = fp.user_id
             `);
             res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching overview statistics:', error);

        res.status(500).json({
            message: 'database error'
        });
    }
});   

 app.post('/api/create-user-plan', async (req, res) => {
    const client = await poolconnect();

    try {
        await client.query('BEGIN');

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

        const userResult = await client.query(
            `INSERT INTO users
            (age, gender, height, weight, activity, goal, diet, budget, workout_days)
            VALUES ($1, $2, $3, $4, $5, $6,$7, $8, $9)
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
            message: 'User and fitness plan created successfully',
            user: user,
            fitnessPlan: planResult.rows[0]
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        
        console.error('Error creating user and fitness plan:', error);

        res.status(500).json({
            message:'Transaction failed'
        });
    }
    finally {
        client.release();
    }
 })


 app.get('/api/stats/bmi', async (req, res) => {
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
            JOIN fitness_plans fp
            ON u.id = fp.user_id
            ORDER BY fp.bmi;
            `);

            res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching BMI statistics:', error);

        res.status(500).json({
            message: 'Database error'
        });
    }
 });
app.listen(port, () => {
    console.log(`FITFUSION is  running on http://localhost:${port}`);
});