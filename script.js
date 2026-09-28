
(function () {
  'use strict';

  // ---------- Meal Database ----------
  // Each meal: { name, kcal, diet: 'veg'|'nonveg', budget: 'low'|'mid'|'high' }
  const MEALS = {
    breakfast: [
      { name: 'Oats with banana & peanut butter', kcal: 380, diet: 'veg',    budget: 'low' },
      { name: 'Greek yogurt parfait with berries', kcal: 320, diet: 'veg',    budget: 'mid' },
      { name: 'Avocado toast with poached egg',    kcal: 420, diet: 'nonveg', budget: 'mid' },
      { name: 'Scrambled eggs & whole-grain toast',kcal: 400, diet: 'nonveg', budget: 'low' },
      { name: 'Protein smoothie bowl',             kcal: 450, diet: 'veg',    budget: 'high' },
      { name: 'Veggie omelette with feta',         kcal: 380, diet: 'nonveg', budget: 'mid' },
      { name: 'Tofu scramble with spinach',        kcal: 350, diet: 'veg',    budget: 'mid' },
      { name: 'Overnight chia pudding',            kcal: 300, diet: 'veg',    budget: 'low' },
      { name: 'Salmon bagel with cream cheese',    kcal: 480, diet: 'nonveg', budget: 'high' }
    ],
    lunch: [
      { name: 'Grilled chicken quinoa bowl',       kcal: 560, diet: 'nonveg', budget: 'mid' },
      { name: 'Chickpea & veggie wrap',            kcal: 480, diet: 'veg',    budget: 'low' },
      { name: 'Turkey & avocado sandwich',         kcal: 520, diet: 'nonveg', budget: 'mid' },
      { name: 'Lentil dal with brown rice',        kcal: 500, diet: 'veg',    budget: 'low' },
      { name: 'Salmon poke bowl',                  kcal: 620, diet: 'nonveg', budget: 'high' },
      { name: 'Paneer stir-fry with rice',         kcal: 540, diet: 'veg',    budget: 'mid' },
      { name: 'Beef & broccoli with jasmine rice', kcal: 640, diet: 'nonveg', budget: 'high' },
      { name: 'Mediterranean falafel plate',       kcal: 520, diet: 'veg',    budget: 'mid' },
      { name: 'Tuna salad with greens',            kcal: 420, diet: 'nonveg', budget: 'low' }
    ],
    dinner: [
      { name: 'Baked salmon with sweet potato',    kcal: 580, diet: 'nonveg', budget: 'high' },
      { name: 'Chicken stir-fry with veggies',     kcal: 520, diet: 'nonveg', budget: 'mid' },
      { name: 'Rajma with brown rice',             kcal: 500, diet: 'veg',    budget: 'low' },
      { name: 'Tofu curry with basmati rice',      kcal: 540, diet: 'veg',    budget: 'mid' },
      { name: 'Grilled shrimp pasta',              kcal: 620, diet: 'nonveg', budget: 'high' },
      { name: 'Vegetable khichdi',                 kcal: 460, diet: 'veg',    budget: 'low' },
      { name: 'Turkey chili with beans',           kcal: 540, diet: 'nonveg', budget: 'mid' },
      { name: 'Roasted veggie & halloumi bowl',    kcal: 560, diet: 'veg',    budget: 'high' },
      { name: 'Egg fried rice with peas',          kcal: 500, diet: 'nonveg', budget: 'low' }
    ],
    snacks: [
      { name: 'Handful of almonds',                kcal: 170, diet: 'veg',    budget: 'mid' },
      { name: 'Apple with peanut butter',          kcal: 220, diet: 'veg',    budget: 'low' },
      { name: 'Greek yogurt with honey',           kcal: 180, diet: 'veg',    budget: 'mid' },
      { name: 'Hard-boiled eggs (2)',              kcal: 160, diet: 'nonveg', budget: 'low' },
      { name: 'Protein shake',                     kcal: 200, diet: 'veg',    budget: 'mid' },
      { name: 'Hummus with carrot sticks',         kcal: 190, diet: 'veg',    budget: 'low' },
      { name: 'Cottage cheese with pineapple',     kcal: 210, diet: 'veg',    budget: 'mid' },
      { name: 'Beef jerky',                        kcal: 180, diet: 'nonveg', budget: 'high' },
      { name: 'Dark chocolate square + walnuts',   kcal: 220, diet: 'veg',    budget: 'high' }
    ]
  };

  // ---------- Workout Templates ----------
  const WORKOUTS = {
    cut: [
      'HIIT + Core',
      'Upper Body Strength',
      'Steady-State Cardio',
      'Lower Body Strength',
      'Full-Body Circuit',
      'Cardio + Mobility',
      'Active Recovery'
    ],
    maintain: [
      'Push Day (Chest/Shoulders/Triceps)',
      'Cardio 30–40 min',
      'Pull Day (Back/Biceps)',
      'Mobility + Core',
      'Leg Day',
      'Full-Body Conditioning',
      'Rest / Walk'
    ],
    bulk: [
      'Chest & Triceps',
      'Back & Biceps',
      'Legs (Quads focus)',
      'Shoulders & Core',
      'Legs (Hamstrings/Glutes)',
      'Arms & Accessories',
      'Rest / Light Cardio'
    ]
  };

  // ---------- State ----------
  let macroChart = null;
  let currentTab = 'breakfast';
  let planContext = null; // { diet, budget }
  let targetCalories = 0;
  const STORAGE_KEY = 'fitfusion.tracker.v1';
  const PLAN_KEY = 'fitfusion.plan.v1';

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const round = (n) => Math.round(n);

  function bmiClass(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25)   return 'Normal';
    if (bmi < 30)   return 'Overweight';
    return 'Obese';
  }

  function calcBMR({ gender, weight, height, age }) {
    // Mifflin–St Jeor
    const base = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? base + 5 : base - 161;
  }

  function goalAdjust(tdee, goal) {
    if (goal === 'cut')   return tdee - 500;
    if (goal === 'bulk')  return tdee + 350;
    return tdee;
  }

  // Macro distribution per goal (protein/carbs/fat as % of kcal)
  const macroMap = {
    cut:      { p: 0.40, c: 0.35, f: 0.25 },
    maintain: { p: 0.30, c: 0.45, f: 0.25 },
    bulk:     { p: 0.30, c: 0.50, f: 0.20 }
  };

  function calcMacros(kcal, goal) {
    const m = macroMap[goal] || macroMap.maintain;
    return {
      protein: round((kcal * m.p) / 4),  // 4 kcal/g
      carbs:   round((kcal * m.c) / 4),
      fat:     round((kcal * m.f) / 9)   // 9 kcal/g
    };
  }

  // Score meals by diet + budget preference
  function scoreMeal(meal, diet, budget) {
    let score = 0;
    if (diet === 'veg' && meal.diet === 'veg')       score += 3;
    if (diet === 'nonveg')                            score += 1; // both allowed
    if (meal.budget === budget)                       score += 2;
    // budget adjacency: low<->mid, mid<->high get partial credit
    if ((budget === 'low' && meal.budget === 'mid') ||
        (budget === 'mid' && (meal.budget === 'low' || meal.budget === 'high')) ||
        (budget === 'high' && meal.budget === 'mid')) score += 1;
    return score;
  }

  function pickMeals(category, diet, budget, count = 3) {
    const pool = MEALS[category].filter(m => diet === 'nonveg' ? true : m.diet === 'veg');
    return pool
      .map(m => ({ m, s: scoreMeal(m, diet, budget) + Math.random() * 0.5 }))
      .sort((a, b) => b.s - a.s)
      .slice(0, count)
      .map(x => x.m);
  }

  // ---------- Rendering ----------
  function renderMetrics(m) {
    $('#bmi').textContent = m.bmi.toFixed(1);
    $('#bmiClass').textContent = m.bmiClass;
    $('#bmr').textContent = `${round(m.bmr)} kcal`;
    $('#tdee').textContent = `${round(m.tdee)} kcal`;
    $('#target').textContent = `${round(m.target)} kcal`;
  }

  function renderMacros(macros) {
    $('#mProtein').textContent = `${macros.protein} g`;
    $('#mCarbs').textContent   = `${macros.carbs} g`;
    $('#mFat').textContent     = `${macros.fat} g`;
    drawChart(macros);
  }

  function drawChart(macros) {
    const ctx = document.getElementById('macroChart').getContext('2d');
    const data = {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [{
        data: [macros.protein, macros.carbs, macros.fat],
        backgroundColor: ['#22d3ee', '#f59e0b', '#a78bfa'],
        borderColor: '#121c2f',
        borderWidth: 3,
        hoverOffset: 6
      }]
    };
    const options = {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed} g`
          }
        }
      }
    };

    if (macroChart) {
      macroChart.data = data;
      macroChart.options = options;
      macroChart.update();
    } else {
      macroChart = new Chart(ctx, { type: 'doughnut', data, options });
    }
  }

  function renderMeals(tab) {
    if (!planContext) return;
    const items = pickMeals(tab, planContext.diet, planContext.budget, 3);
    const panel = $('#mealsPanel');
    panel.innerHTML = items.map(m => `
      <article class="meal">
        <p class="meal-title">${m.name}</p>
        <p class="meal-meta">${m.kcal} kcal</p>
        <div class="meal-tags">
          <span class="tag ${m.diet === 'veg' ? 'veg' : 'nonveg'}">${m.diet === 'veg' ? 'Veg' : 'Non-veg'}</span>
          <span class="tag budget">${m.budget.toUpperCase()} budget</span>
        </div>
      </article>
    `).join('');
  }

  function renderWorkout(goal, days) {
    const plan = WORKOUTS[goal] || WORKOUTS.maintain;
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Distribute 'days' workouts evenly across the week; the rest = rest days
    const idxs = distributeWorkoutDays(days);
    const grid = $('#workoutGrid');
    grid.innerHTML = dayNames.map((dn, i) => {
      const isWorkout = idxs.includes(i);
      const focus = isWorkout ? plan[i % plan.length] : 'Rest';
      const note = isWorkout ? '45–60 min' : 'Light walk / stretch';
      return `
        <div class="day ${isWorkout ? '' : 'rest'}">
          <span class="day-name">${dn}</span>
          <span class="day-focus">${focus}</span>
          <span class="day-note">${note}</span>
        </div>
      `;
    }).join('');
  }

  function distributeWorkoutDays(count) {
    // pick 'count' spaced-out days out of 7
    const n = Math.max(1, Math.min(7, count));
    const step = 7 / n;
    const idxs = [];
    for (let i = 0; i < n; i++) idxs.push(Math.min(6, Math.round(i * step)));
    return Array.from(new Set(idxs));
  }

  // ---------- Tracker ----------
  function loadLog() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveLog(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function renderTracker() {
    const list = loadLog();
    const consumed = list.reduce((sum, x) => sum + Number(x.kcal || 0), 0);
    const target = targetCalories || 0;
    const remaining = Math.max(0, target - consumed);

    $('#consumed').textContent = consumed;
    $('#trackerTarget').textContent = target ? `${target}` : '—';
    $('#remaining').textContent = target ? `${remaining}` : '—';

    const pct = target ? Math.min(100, (consumed / target) * 100) : 0;
    $('#progressBar').style.width = pct + '%';

    const ul = $('#foodList');
    if (list.length === 0) {
      ul.innerHTML = `<li style="justify-content:center;color:var(--muted);">No items logged yet.</li>`;
      return;
    }
    ul.innerHTML = list.map((item) => `
      <li data-id="${item.id}">
        <span class="food-name">${escapeHtml(item.name)}</span>
        <span class="food-kcal">${item.kcal} kcal</span>
        <button class="remove-btn" data-remove="${item.id}" data-testid="remove-${item.id}">Remove</button>
      </li>
    `).join('');
  }

  function addFood(name, kcal) {
    const list = loadLog();
    list.push({ id: Date.now().toString(36), name, kcal: Number(kcal) });
    saveLog(list);
    renderTracker();
  }

  function removeFood(id) {
    const list = loadLog().filter(x => x.id !== id);
    saveLog(list);
    renderTracker();
  }

  function clearLog() {
    saveLog([]);
    renderTracker();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- Plan flow ----------
  function generatePlan(data) {
    const bmr = calcBMR(data);
    const tdee = bmr * data.activity;
    const target = goalAdjust(tdee, data.goal);
    const bmi = data.weight / Math.pow(data.height / 100, 2);
    const macros = calcMacros(target, data.goal);

    renderMetrics({
      bmi,
      bmiClass: bmiClass(bmi),
      bmr,
      tdee,
      target
    });
    renderMacros(macros);

    planContext = { diet: data.diet, budget: data.budget };
    targetCalories = round(target);

    renderMeals(currentTab);
    renderWorkout(data.goal, data.days);
    renderTracker();

    // Persist plan
    localStorage.setItem(PLAN_KEY, JSON.stringify({
      inputs: data,
      target: targetCalories,
      macros,
      context: planContext
    }));

    // Reveal results
    const section = document.getElementById('results');
    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return {
      bmi,
      bmr,
      tdee,
      targetCalories,
      macros

    };
  }

  function readForm() {
    return {
      age: Number($('#age').value),
      gender: $('#gender').value,
      height: Number($('#height').value),
      weight: Number($('#weight').value),
      activity: Number($('#activity').value),
      goal: $('#goal').value,
      diet: $('#diet').value,
      budget: $('#budget').value,
      days: Number($('#days').value)
    };
  }

  function validForm(d) {
    return d.age > 0 && d.height > 0 && d.weight > 0 && d.days >= 1 && d.days <= 7;
  }

  // ---------- Events ----------
  function attachEvents() {
   $('#plannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = readForm();

    if (!validForm(data)) return;

    // Generate the plan
    const plan = generatePlan(data);

    // Send user data to backend
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                age: data.age,
                gender: data.gender,
                height: data.height,
                weight: data.weight,
                activity: data.activity,
                goal: data.goal,
                diet: data.diet,
                budget: data.budget,
                workoutDays: data.days
            })
        });

        console.log('POST status:', response.status);
        if(!response.ok) {
            throw new Error(`user API Error: ${response.status}`);
        }

        const user = await response.json();

        console.log('Backend response:', user);
        console.log('Created user ID:', user.id);

        

        const planResponse = await fetch('/api/fitness-plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            bmi: plan.bmi,
            bmr: plan.bmr,
            tdee: plan.tdee,
            targetCalories: plan.targetCalories,
            protein: plan.macros.protein,
            carbs: plan.macros.carbs,
            fat: plan.macros.fat
          })
        });

        console.log(
          'Fitness plan POST status:',
          planResponse.status
        );


            if (!planResponse.ok) {
                throw new Error(
                    `Fitness Plan API Error: ${planResponse.status}`
                );
            }

            const savedPlan = await planResponse.json();

            console.log('Saved fitness plan:', savedPlan);

            alert(
                `Plan saved successfully!\nUser ID: ${user.id}\nPlan ID: ${savedPlan.id}`
            );


    } catch (error) {
        console.error('Error sending user data:', error);
    }
});



const loadUsersBtn = $('#loadUsersBtn');

console.log("load button:", loadUsersBtn);

if(loadUsersBtn) {
  loadUsersBtn.addEventListener('click', function (e) {
    e.preventDefault();
    console.log("load Users button clicked");
    loadBackendUsers();
  });

} else {
  console.log("load users button not found");
}

 async function loadBackendUsers() {
  console.log("load users function started");
  try {
    const response = await fetch('/api/users');
    console.log('GET status:', response.status);

    if(!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const users = await response.json();
    console.log('Users from backend:', users);
    displayUsers(users);
  } catch (error) {
    console.error('Error loading users:', error);
  }
 }
    
    function displayUsers(users) {
      console.log("🔥 NEW DISPLAY USERS FUNCTION IS RUNNING 🔥");

    const container = document.getElementById(
      'backend-users-container'

    );

    console.log("container:", container);
      console.log("🔥 is HTML element:", container instanceof HTMLElement);

    if(!container) {
      console.error("backend-users-container not found!");
      return;
    }

    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p>No users found.</p>';
        return;
    }

    users.forEach(user => {

        const userCard = document.createElement('div');

        userCard.className = 'user-card';

        userCard.innerHTML = `
            <h3>User #${user.id}</h3>

            <p>Age: ${user.age}</p>
            <p>Gender: ${user.gender}</p>
            <p>Height: ${user.height} cm</p>
            <p>Weight: ${user.weight} kg</p>
            <p>Activity: ${user.activity}</p>
            <p>Goal: ${user.goal}</p>
            <p>Diet: ${user.diet}</p>
            <p>Budget: ${user.budget}</p>
            <p>Workout Days: ${user.workoutDays}</p>
            
        `;
        
        const profileButton = document.createElement("button");
        profileButton.textContent = "view profile";

        profileButton.className = "view-profile-btn";
        profileButton.addEventListener("click", () => {
          showUserProfile(user);
        });

        userCard.appendChild(profileButton);

        const editButton = document.createElement("button");
        editButton.textContent = "Edit User";
        editButton.className = "edit-user-btn";

        editButton.addEventListener("click", () => {
          editUser(user);
        });

        userCard.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete User';
        deleteButton.className = 'delete-user-btn';

        deleteButton.addEventListener('click', () => {
          deleteUser(user.id);
        });

        userCard.appendChild(deleteButton);

        container.appendChild(userCard);
    });
}

 function showUserProfile(user) {
  console.log(" selected user:", user);
  const profileContainer =$('#selected-user');
  if(!profileContainer) {
    console.log("selected-user container not found!");
    return;
  }

 const bmi = user.weight / Math.pow(user.height / 100, 2);
  

  const bmr = calcBMR(user);

let activityMultiplier;

if (user.activity === "sedentary") {
    activityMultiplier = 1.2;
} else if (user.activity === "light") {
    activityMultiplier = 1.375;
} else if (user.activity === "moderate") {
    activityMultiplier = 1.55;
} else if (user.activity === "active") {
    activityMultiplier = 1.725;
} else if (user.activity === "veryActive") {
    activityMultiplier = 1.9;
} else {
    activityMultiplier = Number(user.activity);
}

const tdee = bmr * activityMultiplier;

let profileGoal;

if (user.goal === "gain") {
    profileGoal = "bulk";
} else if (user.goal === "lose") {
    profileGoal = "cut";
} else {
    profileGoal = "maintain";
}

const target = goalAdjust(tdee, profileGoal);

const macros = calcMacros(target, profileGoal);

  profileContainer.innerHTML =`
  <div class="selected-profile">

  <h2>user #${user.id} profile </h2>

  <div class="profile-info">
    
  <p>
     <strong>Age:</strong>
     ${user.age}
     </p>
     <p>
      <strong>Gender:</strong>
      ${user.gender}
      </p>
      <p>
       <strong>Height:</strong>
       ${user.height} cm
      </p>
      <p>
       <strong>Weight:</strong>
       ${user.weight} kg
       </p>
       <p>
    <strong>BMI:</strong>
    ${bmi.toFixed(1)}
</p>

<p>
    <strong>BMI Status:</strong>
    ${bmiClass(bmi)}
</p>

<p>
    <strong>BMR:</strong>
    ${Math.round(bmr)} calories/day
</p>

<p>
    <strong>TDEE:</strong>
    ${Math.round(tdee)} calories/day
</p>

<p>
    <strong>Target Calories:</strong>
    ${Math.round(target)} calories/day
</p>

<p>
    <strong>Protein:</strong>
    ${macros.protein} g/day
</p>

<p>
    <strong>Carbs:</strong>
    ${macros.carbs} g/day
</p>

<p>
    <strong>Fat:</strong>
    ${macros.fat} g/day
</p>
       <p>
        <strong>Activity:</strong>
        ${user.activity}
        </p>
        <p>
         <strong>Goal:</strong>
         ${user.goal}
         </p>
          <p>
                    <strong>Diet:</strong>
                    ${user.diet}
                </p>

                <p>
                    <strong>Budget:</strong>
                    ${user.budget}
                </p>

                <p>
                    <strong>Workout Days:</strong>
                    ${user.workoutDays} days/week
                </p>

            </div>

            </div>

          `;
 }
 
async function editUser(user) {
  console.log("Editting user:", user);

  const age = prompt("Enter new age:", user.age);

  if(age === null){
    return;
  }

  const weight = prompt("Enter new weight:", user.weight);
   if(weight === null) {
    return;
   }

   const goal = prompt("Enter new goal (gain / lose / maintain):", user.goal);
   if(goal === null) {
    return;
   }
   const updatedUser = {
    age: Number(age),
    gender: user.gender,
    height: user.height,
    weight: Number(weight),
    activity: user.activity,
    goal: goal,
    diet: user.diet,
    budget: user.budget,
    workoutDays: user.workoutDays
   };

   console.log("Updated user data:", updatedUser);

   try {
     const response = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
        body: JSON.stringify(updatedUser)
      
     });
     console.log("PUT status:", response.status);
     if(!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`

      );

     }
     const result = await response.json();
     console.log("updated user:", result);
     
     alert(`User #${user.id} updated successfully!`);

     loadBackendUsers();
   }
   catch(error) {
    console.log("Error updating user:", error);
   }
}
   
async function deleteUser(id) {
    console.log("Deleting user:", id);
    const confirmDelete = confirm(
      `Are you sure you want to delete user #${id}?`
    );

    if (!confirmDelete) {
        return;
    }
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      console.log('delete status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const result = await response.json();

      console.log("delete response:", result);

      await loadBackendUsers();
    }
    catch (error) {
      console.error("error deleting user:", error);
    }
}
  

    $('#plannerForm').addEventListener('reset', () => {
      // Optional: hide results on reset
      // document.getElementById('results').classList.add('hidden');
    });

    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        renderMeals(currentTab);
      });
    });

    $('#trackerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#foodName').value.trim();
      const kcal = Number($('#foodKcal').value);
      if (!name || !kcal || kcal <= 0) return;
      addFood(name, kcal);
      $('#foodName').value = '';
      $('#foodKcal').value = '';
      $('#foodName').focus();
    });

    $('#foodList').addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-remove');
      if (id) removeFood(id);
    });

    $('#clearTracker').addEventListener('click', clearLog);
  }

  function restorePlan() {
    try {
      const raw = localStorage.getItem(PLAN_KEY);
      if (!raw) { renderTracker(); return; }
      const saved = JSON.parse(raw);
      if (!saved || !saved.inputs) { renderTracker(); return; }
      const d = saved.inputs;
      // Repopulate form
      $('#age').value = d.age;
      $('#gender').value = d.gender;
      $('#height').value = d.height;
      $('#weight').value = d.weight;
      $('#activity').value = d.activity;
      $('#goal').value = d.goal;
      $('#diet').value = d.diet;
      $('#budget').value = d.budget;
      $('#days').value = d.days;
      generatePlan(d);
    } catch (e) {
      renderTracker();
    }
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    attachEvents();
    restorePlan();
  });
})();


const userBtn = document.getElementById("userbtn");
const container = document.getElementById("backend-users-container");
const selecteduser = document.getElementById("selected-user");

console.log("user button:", userBtn);
console.log(" backend user container:", container);
if(!userBtn){
  console.error("userbtn not found!");
  throw new Error("User button not found");
}
userBtn.addEventListener('click', () => {

  console.log("show users clicked!");

})
fetch('/api/users')
    .then(response => {
        console.log("status:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        return response.json();
    })

    .then(users => {
        console.log("users received:", users);

        if (!container || !Array.isArray(users)) {
            throw new Error("Unable to render users");
        }

        container.innerHTML = "";

        users.forEach(user => {

            // Create user card
            const userCard = document.createElement("button");

            userCard.classList.add("user-card");

            userCard.textContent = `User ${user.id}`;

            userCard.dataset.id = user.id;


            // When user card is clicked
            userCard.addEventListener("click", () => {

                const userId = userCard.dataset.id;

                console.log("selected user ID:", userId);


                // Get selected user
                fetch(`/api/users/${userId}`)
                    .then(response => {

                        if (!response.ok) {
                            throw new Error(`HTTP Error: ${response.status}`);
                        }

                        return response.json();
                    })

                    .then(user => {

                        console.log("selected user:", user);

                        if (!selecteduser) {
                            throw new Error("Selected user element not found");
                        }


                        // Display selected user
                        selecteduser.innerHTML = `
                            <div class="profile-header">

                                <div class="profile-avatar">
                                    👤
                                </div>

                                <div class="profile-title">

                                    <h2>User ${user.id}</h2>

                                    <span class="active-status">
                                        <span class="status-dot"></span>
                                        Active
                                    </span>

                                </div>

                            </div>


                            <div class="profile-stats">

                                <div class="stat-card">

                                    <div class="stat-icon">🎂</div>

                                    <div>
                                        <span class="stat-label">Age</span>
                                        <strong>${user.age} years</strong>
                                    </div>

                                </div>


                                <div class="stat-card">

                                    <div class="stat-icon">📏</div>

                                    <div>
                                        <span class="stat-label">Height</span>
                                        <strong>${user.height} cm</strong>
                                    </div>

                                </div>


                                <div class="stat-card">

                                    <div class="stat-icon">⚖️</div>

                                    <div>
                                        <span class="stat-label">Weight</span>
                                        <strong>${user.weight} kg</strong>
                                    </div>

                                </div>


                                <div class="stat-card">

                                    <div class="stat-icon">🎯</div>

                                    <div>
                                        <span class="stat-label">Goal</span>
                                        <strong>${user.goal}</strong>
                                    </div>

                                </div>


                                <div class="stat-card">

                                    <div class="stat-icon">🥗</div>

                                    <div>
                                        <span class="stat-label">Diet</span>
                                        <strong>${user.diet}</strong>
                                    </div>

                                </div>


                                <div class="stat-card">

                                    <div class="stat-icon">💰</div>

                                    <div>
                                        <span class="stat-label">Budget</span>
                                        <strong>${user.budget}</strong>
                                    </div>

                                </div>


                                <div class="stat-card">

                                    <div class="stat-icon">🏋️</div>

                                    <div>
                                        <span class="stat-label">Workout Days</span>
                                        <strong>${user.workoutDays} days/week</strong>
                                    </div>

                                </div>

                            </div>
                        `;
                    })

                    .catch(error => {
                        console.error("Error loading selected user:", error);
                    });

            });


            // Add card to container
            container.appendChild(userCard);

        });

    })

    .catch(error => {
        console.error("Error loading users:", error);
    });

    