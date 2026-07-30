/* ============================================================
   FitFusion — script.js
   All logic: meal data, calculations, rendering, events, storage
   ============================================================ */

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
    $('#plannerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = readForm();
      if (!validForm(data)) return;
      generatePlan(data);
    });

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
