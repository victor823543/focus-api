import {
  CurrentWeekBarChartData,
  WeekCategoryData,
  WeekScoreLeft,
} from "../controllers/dashboardController.js";
import { DayR } from "../controllers/statsController.js";

export function createCurrentWeekBarChartData(
  thisWeek: DayR[],
  prevWeek: DayR[],
): CurrentWeekBarChartData {
  const currentWeekBarChartData: CurrentWeekBarChartData = [];

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  weekdays.forEach((weekday, index) => {
    const adjustedIndex = (index + 1) % 7;
    const currentWeekDay = thisWeek.find(
      (day) => new Date(day.date).getDay() === adjustedIndex,
    );
    const previousWeekDay = prevWeek.find(
      (day) => new Date(day.date).getDay() === adjustedIndex,
    );

    currentWeekBarChartData.push({
      weekday,
      "Total Score": currentWeekDay ? currentWeekDay.totalScore : 0,
      "Previous Week": previousWeekDay ? previousWeekDay.totalScore : 0,
    });
  });

  return currentWeekBarChartData;
}

export function createWeekCategoryData(days: DayR[]): WeekCategoryData {
  const weekCategoryData: WeekCategoryData = {};

  days.forEach((day) => {
    day.score.forEach((categoryScore) => {
      const id = categoryScore.category.toString();
      if (!weekCategoryData[id]) {
        weekCategoryData[id] = {
          totalScore: 0,
          maxScore: 0,
        };
      }

      weekCategoryData[id].totalScore += categoryScore.calculatedScore;
      weekCategoryData[id].maxScore += categoryScore.importance * 10;
    });
  });

  return weekCategoryData;
}

export function getWeekImprovement(
  currentWeekDays: DayR[],
  previousWeekDays: DayR[],
): number {
  const currentWeekTotal = currentWeekDays.reduce(
    (acc, day) => acc + day.totalScore,
    0,
  );
  const previousWeekTotal = previousWeekDays.reduce(
    (acc, day) => acc + day.totalScore,
    0,
  );

  return ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
}

export function getWeekScoreLeftObject(
  thisWeek: DayR[],
  allWeeks: DayR[][],
): WeekScoreLeft {
  const thisWeekTotal = thisWeek.reduce((acc, day) => acc + day.totalScore, 0);
  const thisWeekDaysLeft = 7 - thisWeek.length;

  let recordWeekScore = 0;
  let averageWeekScore = 0;

  allWeeks.forEach((week) => {
    const total = week.reduce((acc, day) => acc + day.totalScore, 0);
    if (total > recordWeekScore) {
      recordWeekScore = total;
    }
    averageWeekScore += total;
  });

  averageWeekScore /= allWeeks.length;

  const toRecord = recordWeekScore - thisWeekTotal;
  const toAverage = averageWeekScore - thisWeekTotal;
  const avgScoreToRecord = toRecord / thisWeekDaysLeft;
  const avgScoreToAverage = toAverage / thisWeekDaysLeft;

  return {
    toRecord,
    avgScoreToRecord,
    toAverage,
    avgScoreToAverage,
  };
}

export function convertDaysToWeeks(days: DayR[]): DayR[][] {
  // Helper to get the start of the week (Monday)
  function getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  // Initialize weeks array
  const weeks: DayR[][] = [];
  let currentWeekStart = getStartOfWeek(days[0].date); // Starting from the earliest week in `days`
  let currentWeek: DayR[] = [];

  for (const day of days) {
    const dayDate = new Date(day.date);

    // If day falls within the current week, add it to `currentWeek`
    if (
      dayDate >= currentWeekStart &&
      dayDate < new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    ) {
      currentWeek.push(day);
    } else {
      // Push completed week and start a new one
      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }
      currentWeek = [day];
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
  }

  return weeks;
}
