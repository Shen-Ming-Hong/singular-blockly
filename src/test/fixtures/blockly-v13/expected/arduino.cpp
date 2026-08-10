#include <Arduino.h>

int counter = 0;

void blink(int times);

void blink(int times) {
  Serial.println("hello");
}

void setup() {
  counter = 0;
}

void loop() {
}
