import cv2
import mediapipe as mp
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_hands = mp.solutions.hands

# For static images:
IMAGE_FILES = []
with mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.5) as hands:
  for idx, file in enumerate(IMAGE_FILES):
    # Read an image, flip it around y-axis for correct handedness output (see
    # above).
    image = cv2.flip(cv2.imread(file), 1)
    # Convert the BGR image to RGB before processing.
    results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    # Print handedness and draw hand landmarks on the image.
    print('Handedness:', results.multi_handedness)
    if not results.multi_hand_landmarks:
      continue
    image_height, image_width, _ = image.shape
    annotated_image = image.copy()
    for hand_landmarks in results.multi_hand_landmarks:
      print('hand_landmarks:', hand_landmarks)
      print(
          f'Index finger tip coordinates: (',
          f'{hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP].x * image_width}, '
          f'{hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP].y * image_height})'
      )
      mp_drawing.draw_landmarks(
          annotated_image,
          hand_landmarks,
          mp_hands.HAND_CONNECTIONS,
          mp_drawing_styles.get_default_hand_landmarks_style(),
          mp_drawing_styles.get_default_hand_connections_style())
    cv2.imwrite(
        '/tmp/annotated_image' + str(idx) + '.png', cv2.flip(annotated_image, 1))
    # Draw hand world landmarks.
    if not results.multi_hand_world_landmarks:
      continue
    for hand_world_landmarks in results.multi_hand_world_landmarks:
      mp_drawing.plot_landmarks(
        hand_world_landmarks, mp_hands.HAND_CONNECTIONS, azimuth=5)

# For webcam input:
cap = cv2.VideoCapture(0)
with mp_hands.Hands(
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5) as hands:
  
  prev_cx, prev_cy = 0, 0
  alpha = 0.3 # smoothing factor (0 to 1)
  prev_direction = "CENTER"
  stable_count = 0
  threshold = 20
  dx_sum = 0
  dy_sum = 0
  frame_count = 0

  while cap.isOpened():
    success, image = cap.read()
    if not success:
      print("Ignoring empty camera frame.")
      # If loading a video, use 'break' instead of 'continue'.
      continue

    # To improve performance, optionally mark the image as not writeable to
    # pass by reference.
    image.flags.writeable = False
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image)

    # Draw the hand annotations on the image.
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    if results.multi_hand_landmarks:
      for hand_landmarks in results.multi_hand_landmarks[:1]:
        mp_drawing.draw_landmarks(
            image,
            hand_landmarks,
            mp_hands.HAND_CONNECTIONS,
            mp_drawing_styles.get_default_hand_landmarks_style(),
            mp_drawing_styles.get_default_hand_connections_style())

        wrist = hand_landmarks.landmark[mp_hands.HandLandmark.WRIST]
        h, w, _ = image.shape
        
        cx_raw = int(wrist.x * w)
        cy_raw = int(wrist.y * h)
        # smoothing 
        cx = int(alpha * prev_cx + (1 - alpha) * cx_raw)
        cy = int(alpha * prev_cy + (1 - alpha) * cy_raw)

        dx = cx - prev_cx
        dy = cy - prev_cy

        print (dx, dy)
        cv2.circle(image, (cx, cy), 10, (0, 255, 0), -1)

        dx_sum += dx
        dy_sum += dy
        frame_count += 1
 
        if frame_count >= 5:
          avg_dx = dx_sum / 5
          avg_dy = dy_sum / 5

          direction = "CENTER"

          if abs(avg_dx) > abs(avg_dy):
             if avg_dx > 15:
                direction = "RIGHT"
             elif avg_dx < -15:
                direction = "LEFT"
          else:
              if avg_dy > 15:
                direction = "DOWN"
              elif avg_dy < -15:
                direction = "UP"

          dx_sum = 0
          dy_sum = 0 
          frame_count = 0
          prev_direction = direction
          
        cv2.putText(
            image, 
            #f'X:{cx} Y:{cy}', 
            prev_direction,
            #(cx+10, cy-10),
            (10,100),  #fixed position instead of moving with hand 
            cv2.FONT_HERSHEY_SIMPLEX, 
            1, 
            (0,0,255), 
            2)

        prev_cx, prev_cy = cx, cy

    # Flip the image horizontally for a selfie-view display.
    cv2.imshow('MediaPipe Hands', cv2.flip(image, 1))
    if cv2.waitKey(5) & 0xFF == 27:
      break
cap.release()