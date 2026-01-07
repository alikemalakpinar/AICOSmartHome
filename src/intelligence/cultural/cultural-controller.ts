/**
 * AICO Smart Home - Cultural & Seasonal Awareness Controller
 *
 * "A home that speaks your culture's language."
 *
 * Understanding the rhythm of faith, tradition, and seasons.
 * From Ramadan schedules to spring cleaning,
 * from sabbath quiet to birthday celebrations.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  CulturalState,
  CulturalProfile,
  CultureIdentifier,
  ReligiousObservance,
  CalendarAwareness,
  CalendarSystem,
  CalendarDate,
  CulturalEvent,
  EventType,
  SpecialPeriod,
  SpecialPeriodType,
  DailySchedule,
  PrayerTime,
  HomeAdjustment,
  SeasonalContext,
  Season,
  SeasonTransition,
  DaylightInfo,
  LifeEvent,
  LifeEventType,
  HomeMode,
  Greeting,
} from './types';
import type { UserId, RoomId } from '@/types/core';

interface CulturalEvents {
  'period:started': (period: SpecialPeriod) => void;
  'period:ended': (periodId: string) => void;
  'event:approaching': (event: CulturalEvent, daysUntil: number) => void;
  'event:today': (event: CulturalEvent) => void;
  'prayer:time': (prayer: PrayerTime) => void;
  'prayer:approaching': (prayer: PrayerTime, minutesUntil: number) => void;
  'iftar:approaching': (minutesUntil: number) => void;
  'suhoor:approaching': (minutesUntil: number) => void;
  'season:changed': (newSeason: Season) => void;
  'season:transitioning': (transition: SeasonTransition) => void;
  'adjustment:activated': (adjustment: HomeAdjustment) => void;
  'life-event:added': (event: LifeEvent) => void;
  'greeting:available': (greeting: Greeting, event: CulturalEvent) => void;
}

// Location for prayer time calculations
interface Location {
  latitude: number;
  longitude: number;
  timezone: string;
}

export class CulturalAwarenessController extends EventEmitter<CulturalEvents> {
  private state: CulturalState;
  private location: Location;
  private checkInterval: NodeJS.Timeout | null = null;
  private prayerTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(location: Location) {
    super();
    this.location = location;
    this.state = this.initializeState();
    this.startMonitoring();
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  private initializeState(): CulturalState {
    return {
      profile: this.createDefaultProfile(),
      calendar: this.initializeCalendar(),
      currentPeriods: [],
      seasonalContext: this.initializeSeasonalContext(),
      lifeEvents: [],
      upcomingCelebrations: [],
      activeAdjustments: [],
    };
  }

  private createDefaultProfile(): CulturalProfile {
    return {
      id: 'default',
      householdId: 'default',
      primaryCulture: { region: 'turkey' },
      secondaryCultures: [],
      religiousObservances: [],
      culturalPreferences: {
        hospitalityStyle: 'warm_informal',
        guestExpectations: [
          { type: 'offer_tea', automatic: true, timing: 'immediate' },
          { type: 'offer_slippers', automatic: true, timing: 'immediate' },
        ],
        genderSeparation: 'none',
        elderRespect: 'traditional',
        shoesInside: 'forbidden',
        formalAreas: [],
        directness: 'indirect',
        formalityDefault: 'polite',
      },
      familyStructure: {
        type: 'nuclear',
        elderPresent: false,
        childrenPresent: false,
        ageGroups: [],
      },
      communicationStyle: 'high_context',
    };
  }

  private initializeCalendar(): CalendarAwareness {
    const today = new Date();

    return {
      primaryCalendar: 'gregorian',
      secondaryCalendars: ['islamic_hijri'],
      currentDates: new Map([
        ['gregorian', this.getGregorianDate(today)],
        ['islamic_hijri', this.getHijriDate(today)],
      ]),
      upcomingEvents: [],
      activeSpecialPeriods: [],
    };
  }

  private initializeSeasonalContext(): SeasonalContext {
    const currentSeason = this.determineSeason(new Date());

    return {
      currentSeason,
      seasonTransition: null,
      weatherContext: {
        current: 'clear',
        forecast: [],
        extreme: false,
        homeRelevant: [],
      },
      daylightInfo: this.calculateDaylight(new Date()),
      seasonalMood: {
        lightNeed: 'medium',
        energyLevel: 'medium',
        socialTendency: 'mixed',
        suggestions: [],
      },
      homeSeasonalization: {
        currentScheme: currentSeason.name,
        colorPalette: this.getSeasonalColors(currentSeason.name),
        scentSuggestions: this.getSeasonalScents(currentSeason.name),
        musicMood: this.getSeasonalMusicMood(currentSeason.name),
        temperatureOffset: 0,
        lightingAdjustment: 0,
      },
    };
  }

  // ===========================================================================
  // Calendar Calculations
  // ===========================================================================

  private getGregorianDate(date: Date): CalendarDate {
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    return {
      system: 'gregorian',
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      monthName: monthNames[date.getMonth()],
      dayName: dayNames[date.getDay()],
      isSpecialDay: false,
    };
  }

  private getHijriDate(date: Date): CalendarDate {
    // Simplified Hijri calculation
    // In production, use a proper Islamic calendar library
    const hijriMonths = [
      'Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir',
      'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban',
      'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'
    ];

    // Approximate conversion (not accurate - use proper library in production)
    const gregorianEpoch = new Date(622, 6, 19).getTime();
    const daysSinceEpoch = Math.floor((date.getTime() - gregorianEpoch) / (24 * 60 * 60 * 1000));
    const hijriDays = Math.floor(daysSinceEpoch * (33 / 32));
    const hijriYear = Math.floor(hijriDays / 354) + 1;
    const dayOfYear = hijriDays % 354;
    const hijriMonth = Math.floor(dayOfYear / 29.5) + 1;
    const hijriDay = (dayOfYear % 29) + 1;

    return {
      system: 'islamic_hijri',
      year: hijriYear,
      month: Math.min(hijriMonth, 12),
      day: hijriDay,
      monthName: hijriMonths[Math.min(hijriMonth - 1, 11)],
      dayName: '',
      isSpecialDay: hijriMonth === 9, // Ramadan
      specialDayName: hijriMonth === 9 ? 'Ramazan' : undefined,
    };
  }

  // ===========================================================================
  // Prayer Time Calculations
  // ===========================================================================

  /**
   * Calculate prayer times for a given date
   * Using simplified calculation - in production use adhan library
   */
  private calculatePrayerTimes(date: Date): PrayerTime[] {
    const daylight = this.calculateDaylight(date);

    // Simplified prayer times based on sunrise/sunset
    // In production, use proper astronomical calculations
    const sunrise = this.parseTime(daylight.sunrise);
    const sunset = this.parseTime(daylight.sunset);
    const dayLength = sunset - sunrise;

    const fajrTime = sunrise - 90; // 1.5 hours before sunrise
    const dhuhrTime = sunrise + dayLength / 2;
    const asrTime = dhuhrTime + dayLength / 4;
    const maghribTime = sunset;
    const ishaTime = sunset + 90; // 1.5 hours after sunset

    return [
      {
        name: 'İmsak',
        time: this.formatMinutes(fajrTime - 10),
        notificationMinutes: 30,
        quietPeriod: 15,
      },
      {
        name: 'Güneş',
        time: daylight.sunrise,
        notificationMinutes: 10,
        quietPeriod: 10,
      },
      {
        name: 'Öğle',
        time: this.formatMinutes(dhuhrTime),
        notificationMinutes: 15,
        quietPeriod: 10,
      },
      {
        name: 'İkindi',
        time: this.formatMinutes(asrTime),
        notificationMinutes: 15,
        quietPeriod: 10,
      },
      {
        name: 'Akşam',
        time: this.formatMinutes(maghribTime),
        notificationMinutes: 15,
        quietPeriod: 10,
      },
      {
        name: 'Yatsı',
        time: this.formatMinutes(ishaTime),
        notificationMinutes: 15,
        quietPeriod: 10,
      },
    ];
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = Math.floor(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  // ===========================================================================
  // Daylight Calculations
  // ===========================================================================

  private calculateDaylight(date: Date): DaylightInfo {
    // Simplified daylight calculation based on latitude
    const dayOfYear = this.getDayOfYear(date);
    const { latitude } = this.location;

    // Approximate sunrise/sunset (simplified)
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
    const hourAngle = Math.acos(
      -Math.tan(latitude * Math.PI / 180) * Math.tan(declination * Math.PI / 180)
    ) * 180 / Math.PI / 15;

    const solarNoon = 12; // Simplified
    const sunrise = solarNoon - hourAngle;
    const sunset = solarNoon + hourAngle;
    const daylightHours = 2 * hourAngle;

    // Determine trend
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDaylight = this.getDaylightHours(yesterday);
    const trend = daylightHours > yesterdayDaylight ? 'lengthening' :
                  daylightHours < yesterdayDaylight ? 'shortening' : 'stable';

    return {
      sunrise: this.formatMinutes(sunrise * 60),
      sunset: this.formatMinutes(sunset * 60),
      daylightHours: Math.round(daylightHours * 10) / 10,
      goldenHourMorning: this.formatMinutes((sunrise + 0.5) * 60),
      goldenHourEvening: this.formatMinutes((sunset - 0.5) * 60),
      blueHour: this.formatMinutes((sunset + 0.25) * 60),
      trend,
    };
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  }

  private getDaylightHours(date: Date): number {
    const info = this.calculateDaylight(date);
    return info.daylightHours;
  }

  // ===========================================================================
  // Seasonal Awareness
  // ===========================================================================

  private determineSeason(date: Date): Season {
    const month = date.getMonth();
    const day = date.getDate();

    // Northern hemisphere seasons (for Turkey)
    let name: Season['name'];
    let startDate: Date;
    let endDate: Date;

    if (month >= 2 && month < 5) {
      name = 'spring';
      startDate = new Date(date.getFullYear(), 2, 21);
      endDate = new Date(date.getFullYear(), 5, 20);
    } else if (month >= 5 && month < 8) {
      name = 'summer';
      startDate = new Date(date.getFullYear(), 5, 21);
      endDate = new Date(date.getFullYear(), 8, 22);
    } else if (month >= 8 && month < 11) {
      name = 'autumn';
      startDate = new Date(date.getFullYear(), 8, 23);
      endDate = new Date(date.getFullYear(), 11, 20);
    } else {
      name = 'winter';
      startDate = new Date(date.getFullYear(), 11, 21);
      endDate = new Date(date.getFullYear() + 1, 2, 20);
    }

    const localNames: Record<Season['name'], string> = {
      spring: 'İlkbahar',
      summer: 'Yaz',
      autumn: 'Sonbahar',
      winter: 'Kış',
    };

    return {
      name,
      localName: localNames[name],
      startDate,
      endDate,
      characteristics: this.getSeasonCharacteristics(name),
      culturalSignificance: this.getSeasonCulturalSignificance(name),
    };
  }

  private getSeasonCharacteristics(season: Season['name']): Season['characteristics'] {
    const characteristics: Record<Season['name'], Season['characteristics']> = {
      spring: [
        { type: 'temperature', description: 'Isınan havalar', homeImplication: 'Isıtmayı kademeli azalt' },
        { type: 'daylight', description: 'Uzayan günler', homeImplication: 'Perde zamanlamasını ayarla' },
        { type: 'activity', description: 'Dış mekan aktiviteleri', homeImplication: 'Bahçe sistemlerini aktifleştir' },
      ],
      summer: [
        { type: 'temperature', description: 'Sıcak havalar', homeImplication: 'Soğutmayı optimize et' },
        { type: 'daylight', description: 'Uzun günler', homeImplication: 'Güneş ışığını yönet' },
        { type: 'activity', description: 'Tatil sezonu', homeImplication: 'Uzun süreli uzakta modu' },
      ],
      autumn: [
        { type: 'temperature', description: 'Serinleyen havalar', homeImplication: 'Isıtmaya hazırlan' },
        { type: 'daylight', description: 'Kısalan günler', homeImplication: 'Aydınlatmayı artır' },
        { type: 'mood', description: 'İç mekan sezonu', homeImplication: 'Sıcak atmosfer oluştur' },
      ],
      winter: [
        { type: 'temperature', description: 'Soğuk havalar', homeImplication: 'Isıtmayı optimize et' },
        { type: 'daylight', description: 'Kısa günler', homeImplication: 'Yapay aydınlatmayı artır' },
        { type: 'mood', description: 'Kış uykusu', homeImplication: 'Konforlu ortam' },
      ],
    };

    return characteristics[season];
  }

  private getSeasonCulturalSignificance(season: Season['name']): string[] {
    const significance: Record<Season['name'], string[]> = {
      spring: ['Nevruz', 'Hıdırellez', 'Paskalya', 'Bahar Bayramı'],
      summer: ['Tatil Sezonu', 'Kurban Bayramı (değişken)', 'Yaz Festivalleri'],
      autumn: ['Okulların Açılışı', 'Hasat Festivalleri', 'Cumhuriyet Bayramı'],
      winter: ['Yılbaşı', 'Noel', 'Ramazan Bayramı (değişken)'],
    };

    return significance[season];
  }

  private getSeasonalColors(season: Season['name']): string[] {
    const colors: Record<Season['name'], string[]> = {
      spring: ['#90EE90', '#FFB6C1', '#87CEEB', '#FFFACD'],
      summer: ['#FF6347', '#FFD700', '#00CED1', '#98FB98'],
      autumn: ['#D2691E', '#FF8C00', '#8B4513', '#DAA520'],
      winter: ['#E0FFFF', '#B0C4DE', '#708090', '#FFFAFA'],
    };

    return colors[season];
  }

  private getSeasonalScents(season: Season['name']): string[] {
    const scents: Record<Season['name'], string[]> = {
      spring: ['Çiçek', 'Taze çim', 'Yağmur'],
      summer: ['Deniz', 'Narenciye', 'Nane'],
      autumn: ['Tarçın', 'Elma', 'Odun ateşi'],
      winter: ['Çam', 'Vanilya', 'Sıcak baharat'],
    };

    return scents[season];
  }

  private getSeasonalMusicMood(season: Season['name']): string {
    const moods: Record<Season['name'], string> = {
      spring: 'uplifting',
      summer: 'energetic',
      autumn: 'mellow',
      winter: 'cozy',
    };

    return moods[season];
  }

  // ===========================================================================
  // Special Period Management (Ramadan, etc.)
  // ===========================================================================

  /**
   * Start a special period like Ramadan
   */
  public startSpecialPeriod(type: SpecialPeriodType, startDate: Date, endDate: Date): SpecialPeriod {
    const period = this.createSpecialPeriod(type, startDate, endDate);
    this.state.currentPeriods.push(period);

    // Set up prayer time notifications if Islamic observance
    if (type === 'ramadan') {
      this.setupRamadanSchedule(period);
    }

    this.emit('period:started', period);
    return period;
  }

  private createSpecialPeriod(
    type: SpecialPeriodType,
    startDate: Date,
    endDate: Date
  ): SpecialPeriod {
    const periodConfigs: Partial<Record<SpecialPeriodType, Partial<SpecialPeriod>>> = {
      ramadan: {
        name: 'Ramazan',
        dailySchedule: this.createRamadanSchedule(),
        restrictions: [
          { type: 'no_cooking_smell', strictness: 'reminder', exceptions: ['iftar_preparation'] },
        ],
        homeMode: this.createRamadanHomeMode(),
      },
      shabbat: {
        name: 'Şabat',
        restrictions: [
          { type: 'no_work', strictness: 'enforced' },
          { type: 'quiet_mode', strictness: 'enforced' },
        ],
        homeMode: this.createShabbatHomeMode(),
      },
    };

    const config = periodConfigs[type] || {};

    return {
      id: `period_${Date.now()}`,
      name: config.name || type,
      type,
      startDate,
      endDate,
      dailySchedule: config.dailySchedule,
      restrictions: config.restrictions || [],
      homeMode: config.homeMode || this.createDefaultHomeMode(),
      automations: [],
    };
  }

  private createRamadanSchedule(): DailySchedule {
    const prayerTimes = this.calculatePrayerTimes(new Date());
    const iftarTime = prayerTimes.find(p => p.name === 'Akşam')?.time || '19:00';
    const suhoorEnd = prayerTimes.find(p => p.name === 'İmsak')?.time || '04:30';

    return {
      fastingStart: suhoorEnd,
      fastingEnd: iftarTime,
      prayerTimes,
      mealTimes: [
        {
          meal: 'suhoor',
          time: this.formatMinutes(this.parseTime(suhoorEnd) - 60),
          preparation: 30,
          duration: 45,
          automations: ['kitchen_lights_on', 'coffee_maker_start'],
        },
        {
          meal: 'iftar',
          time: iftarTime,
          preparation: 60,
          duration: 90,
          automations: ['dining_scene', 'cooking_ventilation'],
        },
      ],
      activeHours: [
        { start: '20:00', end: '02:00' },
        { start: '04:00', end: '05:30' },
      ],
      quietHours: [
        { start: '05:30', end: '07:00' },
        { start: '14:00', end: '16:00' },
      ],
    };
  }

  private createRamadanHomeMode(): HomeMode {
    return {
      name: 'Ramazan Modu',
      lighting: {
        defaultScheme: 'warm_peaceful',
        maxBrightness: 80,
        colorTemperature: 2700,
        specialScenes: ['iftar_scene', 'teravih_scene', 'suhoor_scene'],
      },
      audio: {
        musicAllowed: true,
        allowedGenres: ['islamic', 'peaceful', 'classical'],
        maxVolume: 60,
        callToActionEnabled: true, // Ezan
      },
      climate: {
        preferredTemp: 22,
        ecoMode: true,
        ventilationBoost: ['17:00', '03:00'], // Before iftar and suhoor
      },
      notifications: {
        silentHours: [{ start: '23:00', end: '03:30' }],
        allowedCategories: ['prayer', 'meal', 'emergency'],
        prayerReminders: true,
        mealReminders: true,
      },
    };
  }

  private createShabbatHomeMode(): HomeMode {
    return {
      name: 'Şabat Modu',
      lighting: {
        defaultScheme: 'shabbat_candles',
        maxBrightness: 60,
        colorTemperature: 2400,
        specialScenes: ['candle_lighting', 'havdalah'],
      },
      audio: {
        musicAllowed: false,
        maxVolume: 40,
        callToActionEnabled: false,
      },
      climate: {
        preferredTemp: 21,
        ecoMode: true,
      },
      notifications: {
        silentHours: [{ start: '00:00', end: '23:59' }],
        allowedCategories: ['emergency'],
        prayerReminders: false,
        mealReminders: true,
      },
    };
  }

  private createDefaultHomeMode(): HomeMode {
    return {
      name: 'Varsayılan',
      lighting: {
        defaultScheme: 'normal',
        maxBrightness: 100,
        colorTemperature: 4000,
        specialScenes: [],
      },
      audio: {
        musicAllowed: true,
        maxVolume: 100,
        callToActionEnabled: false,
      },
      climate: {
        preferredTemp: 22,
        ecoMode: false,
      },
      notifications: {
        silentHours: [],
        allowedCategories: ['all'],
        prayerReminders: false,
        mealReminders: false,
      },
    };
  }

  private setupRamadanSchedule(period: SpecialPeriod): void {
    if (!period.dailySchedule) return;

    // Store prayer schedule in state
    this.state.prayerSchedule = period.dailySchedule.prayerTimes;

    // Set up daily timers
    this.setupDailyPrayerTimers();

    // Set up iftar/suhoor notifications
    this.setupMealTimers(period.dailySchedule);
  }

  private setupDailyPrayerTimers(): void {
    // Clear existing timers
    for (const timer of this.prayerTimers.values()) {
      clearTimeout(timer);
    }
    this.prayerTimers.clear();

    if (!this.state.prayerSchedule) return;

    const now = new Date();
    const today = now.toDateString();

    for (const prayer of this.state.prayerSchedule) {
      const prayerTime = new Date(`${today} ${prayer.time}`);

      // Approaching notification
      const approachTime = new Date(prayerTime.getTime() - prayer.notificationMinutes * 60 * 1000);
      if (approachTime > now) {
        const delay = approachTime.getTime() - now.getTime();
        const timer = setTimeout(() => {
          this.emit('prayer:approaching', prayer, prayer.notificationMinutes);
        }, delay);
        this.prayerTimers.set(`${prayer.name}_approach`, timer);
      }

      // Prayer time notification
      if (prayerTime > now) {
        const delay = prayerTime.getTime() - now.getTime();
        const timer = setTimeout(() => {
          this.emit('prayer:time', prayer);
        }, delay);
        this.prayerTimers.set(`${prayer.name}_time`, timer);
      }
    }
  }

  private setupMealTimers(schedule: DailySchedule): void {
    const now = new Date();
    const today = now.toDateString();

    for (const meal of schedule.mealTimes) {
      const mealTime = new Date(`${today} ${meal.time}`);
      const prepTime = new Date(mealTime.getTime() - meal.preparation * 60 * 1000);

      // Preparation notification
      if (prepTime > now) {
        const delay = prepTime.getTime() - now.getTime();
        setTimeout(() => {
          if (meal.meal === 'iftar') {
            this.emit('iftar:approaching', meal.preparation);
          } else if (meal.meal === 'suhoor') {
            this.emit('suhoor:approaching', meal.preparation);
          }
        }, delay);
      }
    }
  }

  // ===========================================================================
  // Cultural Events
  // ===========================================================================

  /**
   * Get upcoming cultural events
   */
  public getUpcomingEvents(daysAhead: number = 30): CulturalEvent[] {
    const events: CulturalEvent[] = [];
    const today = new Date();
    const endDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Turkish national holidays
    const turkishHolidays = this.getTurkishHolidays(today.getFullYear());

    // Islamic holidays (approximate - would use proper calculation in production)
    const islamicHolidays = this.getIslamicHolidays(today.getFullYear());

    // Combine and filter
    const allEvents = [...turkishHolidays, ...islamicHolidays];

    for (const event of allEvents) {
      const eventDate = this.getEventDate(event, today.getFullYear());
      if (eventDate && eventDate >= today && eventDate <= endDate) {
        events.push(event);
      }
    }

    // Sort by date
    events.sort((a, b) => {
      const dateA = this.getEventDate(a, today.getFullYear());
      const dateB = this.getEventDate(b, today.getFullYear());
      return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    });

    return events;
  }

  private getTurkishHolidays(year: number): CulturalEvent[] {
    return [
      this.createEvent('new_year', 'Yılbaşı', 'new_year', { month: 1, day: 1 }, 'major'),
      this.createEvent('national_sovereignty', 'Ulusal Egemenlik ve Çocuk Bayramı', 'national_holiday', { month: 4, day: 23 }, 'major'),
      this.createEvent('labor_day', 'Emek ve Dayanışma Günü', 'national_holiday', { month: 5, day: 1 }, 'significant'),
      this.createEvent('youth_day', 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı', 'national_holiday', { month: 5, day: 19 }, 'major'),
      this.createEvent('democracy_day', 'Demokrasi ve Milli Birlik Günü', 'national_holiday', { month: 7, day: 15 }, 'significant'),
      this.createEvent('victory_day', 'Zafer Bayramı', 'national_holiday', { month: 8, day: 30 }, 'major'),
      this.createEvent('republic_day', 'Cumhuriyet Bayramı', 'national_holiday', { month: 10, day: 29 }, 'major'),
    ];
  }

  private getIslamicHolidays(year: number): CulturalEvent[] {
    // These dates would be calculated properly in production
    // Using approximate Gregorian dates for demonstration
    return [
      this.createEvent('ramadan_start', 'Ramazan Başlangıcı', 'fasting_period', { type: 'lunar', calculation: 'ramadan_1' }, 'major'),
      this.createEvent('kadir_night', 'Kadir Gecesi', 'religious_major', { type: 'lunar', calculation: 'ramadan_27' }, 'major'),
      this.createEvent('eid_fitr', 'Ramazan Bayramı', 'religious_major', { type: 'lunar', calculation: 'shawwal_1', duration: 3 }, 'major'),
      this.createEvent('eid_adha', 'Kurban Bayramı', 'religious_major', { type: 'lunar', calculation: 'dhul_hijjah_10', duration: 4 }, 'major'),
      this.createEvent('mawlid', 'Mevlid Kandili', 'religious_minor', { type: 'lunar', calculation: 'rabi_al_awwal_12' }, 'significant'),
    ];
  }

  private createEvent(
    id: string,
    name: string,
    type: EventType,
    date: { month?: number; day?: number; type?: string; calculation?: string; duration?: number },
    importance: CulturalEvent['importance']
  ): CulturalEvent {
    return {
      id,
      name,
      localName: name,
      type,
      culture: { region: 'turkey' },
      date: {
        type: date.type as any || 'fixed',
        month: date.month,
        day: date.day,
        calculation: date.calculation,
        duration: date.duration || 1,
        preparationDays: importance === 'major' ? 3 : 1,
      },
      importance,
      traditions: [],
      homeAdjustments: this.getEventAdjustments(type, importance),
      greetings: this.getEventGreetings(id),
    };
  }

  private getEventDate(event: CulturalEvent, year: number): Date | null {
    if (event.date.type === 'fixed' && event.date.month && event.date.day) {
      return new Date(year, event.date.month - 1, event.date.day);
    }
    // For lunar dates, would need proper calculation
    return null;
  }

  private getEventAdjustments(type: EventType, importance: CulturalEvent['importance']): HomeAdjustment[] {
    const adjustments: HomeAdjustment[] = [];

    if (importance === 'major') {
      adjustments.push({
        type: 'lighting_scheme',
        parameters: { scheme: 'festive' },
        timing: 'during',
        priority: 1,
      });

      adjustments.push({
        type: 'guest_preparation',
        parameters: { expectGuests: true },
        timing: 'preparation',
        priority: 2,
      });
    }

    if (type === 'religious_major') {
      adjustments.push({
        type: 'special_scene',
        parameters: { scene: 'bayram' },
        timing: 'during',
        priority: 1,
      });
    }

    return adjustments;
  }

  private getEventGreetings(eventId: string): Greeting[] {
    const greetings: Record<string, Greeting[]> = {
      eid_fitr: [
        { language: 'tr', text: 'Ramazan Bayramınız mübarek olsun', appropriate: 'all_day', voiceEnabled: true },
        { language: 'tr', text: 'İyi bayramlar', appropriate: 'on_meeting', voiceEnabled: true },
      ],
      eid_adha: [
        { language: 'tr', text: 'Kurban Bayramınız mübarek olsun', appropriate: 'all_day', voiceEnabled: true },
        { language: 'tr', text: 'İyi bayramlar', appropriate: 'on_meeting', voiceEnabled: true },
      ],
      new_year: [
        { language: 'tr', text: 'Mutlu yıllar', appropriate: 'all_day', voiceEnabled: true },
        { language: 'tr', text: 'Yeni yılınız kutlu olsun', appropriate: 'on_meeting', voiceEnabled: true },
      ],
      republic_day: [
        { language: 'tr', text: 'Cumhuriyet Bayramımız kutlu olsun', appropriate: 'all_day', voiceEnabled: true },
      ],
    };

    return greetings[eventId] || [];
  }

  // ===========================================================================
  // Life Events
  // ===========================================================================

  /**
   * Record a life event
   */
  public addLifeEvent(event: Omit<LifeEvent, 'id'>): LifeEvent {
    const lifeEvent: LifeEvent = {
      ...event,
      id: `life_${Date.now()}`,
    };

    this.state.lifeEvents.push(lifeEvent);
    this.emit('life-event:added', lifeEvent);

    // Apply cultural treatment
    this.applyCulturalTreatment(lifeEvent);

    return lifeEvent;
  }

  private applyCulturalTreatment(event: LifeEvent): void {
    // Adjust home based on event type
    const adjustments = this.getLifeEventAdjustments(event.type);

    for (const adjustment of adjustments) {
      this.state.activeAdjustments.push(adjustment);
      this.emit('adjustment:activated', adjustment);
    }
  }

  private getLifeEventAdjustments(type: LifeEventType): HomeAdjustment[] {
    const adjustments: Record<LifeEventType, HomeAdjustment[]> = {
      loss: [
        { type: 'lighting_scheme', parameters: { scheme: 'subdued' }, timing: 'during', priority: 1 },
        { type: 'notification_silence', parameters: { duration: 'extended' }, timing: 'during', priority: 1 },
      ],
      wedding: [
        { type: 'lighting_scheme', parameters: { scheme: 'celebration' }, timing: 'during', priority: 1 },
        { type: 'guest_preparation', parameters: { large_gathering: true }, timing: 'preparation', priority: 1 },
      ],
      birth: [
        { type: 'lighting_scheme', parameters: { scheme: 'gentle' }, timing: 'during', priority: 1 },
        { type: 'temperature_preset', parameters: { baby_safe: true }, timing: 'during', priority: 1 },
      ],
      birthday: [
        { type: 'special_scene', parameters: { scene: 'birthday' }, timing: 'during', priority: 2 },
      ],
      illness: [
        { type: 'lighting_scheme', parameters: { scheme: 'comfort' }, timing: 'during', priority: 1 },
        { type: 'temperature_preset', parameters: { recovery: true }, timing: 'during', priority: 1 },
      ],
      // ... other events
      engagement: [],
      graduation: [],
      new_job: [],
      retirement: [],
      new_home: [],
      anniversary: [],
      divorce: [],
      job_loss: [],
      moving_away: [],
      child_leaving: [],
      elder_moving_in: [],
      pet_arrival: [],
      pet_loss: [],
    };

    return adjustments[type] || [];
  }

  // ===========================================================================
  // Monitoring
  // ===========================================================================

  private startMonitoring(): void {
    // Check every hour
    this.checkInterval = setInterval(() => {
      this.updateState();
      this.checkUpcomingEvents();
      this.checkSeasonChange();
    }, 60 * 60 * 1000);

    // Initial check
    this.updateState();
  }

  private updateState(): void {
    // Update calendar dates
    const today = new Date();
    this.state.calendar.currentDates.set('gregorian', this.getGregorianDate(today));
    this.state.calendar.currentDates.set('islamic_hijri', this.getHijriDate(today));

    // Update daylight info
    this.state.seasonalContext.daylightInfo = this.calculateDaylight(today);

    // Update prayer times if observing
    if (this.state.currentPeriods.some(p => p.type === 'ramadan')) {
      this.state.prayerSchedule = this.calculatePrayerTimes(today);
      this.setupDailyPrayerTimers();
    }
  }

  private checkUpcomingEvents(): void {
    const today = new Date();
    const upcoming = this.getUpcomingEvents(7);

    for (const event of upcoming) {
      const eventDate = this.getEventDate(event, today.getFullYear());
      if (!eventDate) continue;

      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

      if (daysUntil === 0) {
        this.emit('event:today', event);

        // Provide greeting
        if (event.greetings.length > 0) {
          this.emit('greeting:available', event.greetings[0], event);
        }
      } else if (daysUntil <= 3 && event.importance === 'major') {
        this.emit('event:approaching', event, daysUntil);
      }
    }

    this.state.upcomingCelebrations = upcoming;
  }

  private checkSeasonChange(): void {
    const currentSeason = this.determineSeason(new Date());

    if (currentSeason.name !== this.state.seasonalContext.currentSeason.name) {
      this.state.seasonalContext.currentSeason = currentSeason;
      this.state.seasonalContext.homeSeasonalization = {
        currentScheme: currentSeason.name,
        colorPalette: this.getSeasonalColors(currentSeason.name),
        scentSuggestions: this.getSeasonalScents(currentSeason.name),
        musicMood: this.getSeasonalMusicMood(currentSeason.name),
        temperatureOffset: 0,
        lightingAdjustment: 0,
      };

      this.emit('season:changed', currentSeason);
    }
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  public getState(): Readonly<CulturalState> {
    return this.state;
  }

  public getProfile(): CulturalProfile {
    return this.state.profile;
  }

  public updateProfile(updates: Partial<CulturalProfile>): void {
    Object.assign(this.state.profile, updates);
  }

  public getCurrentSeason(): Season {
    return this.state.seasonalContext.currentSeason;
  }

  public getDaylightInfo(): DaylightInfo {
    return this.state.seasonalContext.daylightInfo;
  }

  public getPrayerTimes(): PrayerTime[] {
    return this.state.prayerSchedule || this.calculatePrayerTimes(new Date());
  }

  public getActivePeriods(): SpecialPeriod[] {
    return [...this.state.currentPeriods];
  }

  public endSpecialPeriod(periodId: string): void {
    const index = this.state.currentPeriods.findIndex(p => p.id === periodId);
    if (index !== -1) {
      this.state.currentPeriods.splice(index, 1);
      this.emit('period:ended', periodId);
    }
  }

  public getCalendarDate(system: CalendarSystem): CalendarDate | undefined {
    return this.state.calendar.currentDates.get(system);
  }

  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    for (const timer of this.prayerTimers.values()) {
      clearTimeout(timer);
    }
    this.prayerTimers.clear();

    this.removeAllListeners();
  }
}

export default CulturalAwarenessController;
