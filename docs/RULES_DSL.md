# AICO Smart Home - Rules-as-Code DSL

## Overview

The Rules-as-Code engine provides a domain-specific language for defining home automation logic. Rules are version-controlled, testable, and auditable.

## Syntax Specification

### Rule Structure

```yaml
rule:
  id: unique-rule-identifier
  name: "Human Readable Name"
  description: "What this rule does"
  version: 1
  enabled: true
  priority: normal  # low | normal | high | critical

  triggers:
    - type: event | schedule | condition
      # trigger-specific configuration

  conditions:
    - type: device | time | user | weather | custom
      # condition-specific configuration

  actions:
    - type: device | notification | scene | rule
      # action-specific configuration

  metadata:
    author: user-id
    created: ISO-timestamp
    modified: ISO-timestamp
    tags: [tag1, tag2]
```

## Trigger Types

### Event Triggers

```yaml
triggers:
  - type: event
    source: device
    device: living-room-motion-sensor
    event: motion_detected

  - type: event
    source: system
    event: mode_changed
    filter:
      from: away
      to: home
```

### Schedule Triggers

```yaml
triggers:
  - type: schedule
    cron: "0 7 * * 1-5"  # 7 AM weekdays

  - type: schedule
    time: "sunset"
    offset: -30m  # 30 minutes before sunset

  - type: schedule
    interval: 15m
```

### Condition Triggers (Poll-based)

```yaml
triggers:
  - type: condition
    poll_interval: 1m
    condition:
      type: device
      device: outdoor-temperature
      property: temperature
      operator: lt
      value: 0
```

## Condition Types

### Device Conditions

```yaml
conditions:
  - type: device
    device: thermostat-living-room
    property: temperature
    operator: gt  # gt | lt | eq | ne | gte | lte | between
    value: 25

  - type: device
    device: door-sensor-front
    property: state
    operator: eq
    value: open
```

### Time Conditions

```yaml
conditions:
  - type: time
    between:
      start: "22:00"
      end: "06:00"

  - type: time
    day_of_week: [saturday, sunday]

  - type: time
    after: sunset
    before: "23:00"
```

### User Conditions

```yaml
conditions:
  - type: user
    present: true
    users: [user-alice, user-bob]

  - type: user
    at_home: false
    all_users: true
```

### Weather Conditions

```yaml
conditions:
  - type: weather
    property: condition
    operator: eq
    value: rain

  - type: weather
    property: temperature
    operator: lt
    value: 5
```

### Compound Conditions

```yaml
conditions:
  - type: compound
    operator: and  # and | or | not
    conditions:
      - type: time
        after: "22:00"
      - type: device
        device: presence-sensor
        property: occupied
        operator: eq
        value: true
```

## Action Types

### Device Actions

```yaml
actions:
  - type: device
    device: light-living-room
    command: set
    parameters:
      brightness: 80
      color_temp: 3000

  - type: device
    device: blinds-bedroom
    command: set_position
    parameters:
      position: 0
```

### Scene Actions

```yaml
actions:
  - type: scene
    scene: evening-relax
    transition: 5s
```

### Notification Actions

```yaml
actions:
  - type: notification
    recipients: [user-alice]
    title: "Security Alert"
    body: "Motion detected in garage"
    priority: high
    sound: alert
```

### Delay Actions

```yaml
actions:
  - type: delay
    duration: 5m

  - type: delay
    until: "08:00"
```

### Rule Actions

```yaml
actions:
  - type: rule
    action: enable  # enable | disable | trigger
    rule: another-rule-id
```

## Variables and Templates

### Built-in Variables

```yaml
actions:
  - type: device
    device: "{{ trigger.device }}"  # Reference trigger source
    command: set
    parameters:
      brightness: "{{ devices.light_living.state.brightness + 20 }}"
```

### Available Variables

| Variable | Description |
|----------|-------------|
| `trigger` | Trigger event data |
| `devices` | All device states |
| `users` | User presence data |
| `time` | Current time info |
| `weather` | Weather data |
| `residence` | Residence state |
| `history` | Historical data access |

## Example Rules

### Morning Routine

```yaml
rule:
  id: morning-routine
  name: "Morning Routine"
  description: "Wake up sequence on weekday mornings"
  version: 2
  enabled: true
  priority: normal

  triggers:
    - type: schedule
      time: "06:30"
      days: [monday, tuesday, wednesday, thursday, friday]

  conditions:
    - type: user
      present: true
      users: [user-alice]

  actions:
    - type: device
      device: blinds-master-bedroom
      command: set_position
      parameters:
        position: 50

    - type: delay
      duration: 5m

    - type: device
      device: lights-master-bedroom
      command: set
      parameters:
        brightness: 30
        color_temp: 4000

    - type: device
      device: coffee-machine
      command: brew
      parameters:
        size: large
        strength: medium

    - type: device
      device: thermostat-bathroom
      command: set
      parameters:
        temperature: 23

  metadata:
    author: user-alice
    created: "2024-01-15T10:00:00Z"
    tags: [morning, routine, bedroom]
```

### Security Response

```yaml
rule:
  id: security-motion-alert
  name: "Away Mode Motion Alert"
  description: "Alert on motion when nobody home"
  version: 1
  enabled: true
  priority: critical

  triggers:
    - type: event
      source: device
      device: "*"  # Any device
      event: motion_detected
      filter:
        device_type: motion_sensor

  conditions:
    - type: compound
      operator: and
      conditions:
        - type: user
          at_home: false
          all_users: true
        - type: device
          device: security-system
          property: mode
          operator: eq
          value: armed_away

  actions:
    - type: notification
      recipients: [user-alice, user-bob]
      title: "🚨 Security Alert"
      body: "Motion detected: {{ trigger.device.name }} at {{ time.now | format:'HH:mm' }}"
      priority: critical

    - type: device
      device: cameras-all
      command: record
      parameters:
        duration: 300

    - type: device
      device: lights-exterior
      command: set
      parameters:
        brightness: 100

  metadata:
    author: system
    created: "2024-01-01T00:00:00Z"
    tags: [security, critical, motion]
```

### Energy Optimization

```yaml
rule:
  id: energy-peak-reduction
  name: "Peak Energy Reduction"
  description: "Reduce consumption during peak hours"
  version: 1
  enabled: true
  priority: normal

  triggers:
    - type: schedule
      cron: "0 17 * * 1-5"  # 5 PM weekdays (peak start)

  conditions:
    - type: device
      device: grid-meter
      property: rate_tier
      operator: eq
      value: peak

  actions:
    - type: device
      device: ev-charger
      command: pause

    - type: device
      device: pool-pump
      command: off

    - type: device
      device: water-heater
      command: set
      parameters:
        temperature: 50  # Lower from 60

    - type: device
      device: all-hvac
      command: set
      parameters:
        temperature_offset: +2  # Increase setpoint by 2°

    - type: device
      device: battery-system
      command: discharge
      parameters:
        mode: peak_shaving

  metadata:
    author: user-bob
    created: "2024-02-01T14:00:00Z"
    tags: [energy, peak, optimization]
```

### Presence-Based Comfort

```yaml
rule:
  id: room-presence-comfort
  name: "Room Presence Comfort"
  description: "Adjust room climate when occupied"
  version: 1
  enabled: true
  priority: normal

  triggers:
    - type: event
      source: device
      event: presence_changed
      filter:
        device_type: presence_sensor

  conditions: []  # No additional conditions

  actions:
    - type: conditional
      if:
        type: device
        device: "{{ trigger.device }}"
        property: presence
        operator: eq
        value: true
      then:
        - type: device
          device: "{{ trigger.device.room }}.thermostat"
          command: set
          parameters:
            mode: comfort
        - type: device
          device: "{{ trigger.device.room }}.lights"
          command: set
          parameters:
            scene: occupied
      else:
        - type: delay
          duration: 10m
        - type: device
          device: "{{ trigger.device.room }}.thermostat"
          command: set
          parameters:
            mode: eco
        - type: device
          device: "{{ trigger.device.room }}.lights"
          command: off

  metadata:
    author: system
    tags: [presence, comfort, hvac, lighting]
```

## Testing Rules

### Test Definition

```yaml
test:
  rule: morning-routine
  name: "Morning routine triggers correctly"

  setup:
    time: "2024-03-15T06:30:00"
    day: friday
    devices:
      blinds-master-bedroom:
        position: 100
      lights-master-bedroom:
        brightness: 0
    users:
      user-alice:
        present: true

  trigger:
    type: schedule
    time: "06:30"

  expect:
    devices:
      blinds-master-bedroom:
        position: 50
      coffee-machine:
        state: brewing
    notifications: []
```

### Running Tests

```bash
# Run all rule tests
aico rules test

# Run specific rule tests
aico rules test --rule morning-routine

# Validate rule syntax
aico rules validate rules/morning-routine.yaml
```

## Audit Trail

All rule executions are logged:

```json
{
  "timestamp": "2024-03-15T06:30:00.123Z",
  "rule_id": "morning-routine",
  "rule_version": 2,
  "trigger": {
    "type": "schedule",
    "time": "06:30"
  },
  "conditions_evaluated": [
    {
      "type": "user",
      "result": true,
      "details": { "user": "user-alice", "present": true }
    }
  ],
  "actions_executed": [
    {
      "type": "device",
      "device": "blinds-master-bedroom",
      "command": "set_position",
      "result": "success",
      "duration_ms": 45
    }
  ],
  "total_duration_ms": 523
}
```
