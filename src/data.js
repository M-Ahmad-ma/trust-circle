/**
 * Static content for the Explore and Place Detail screens.
 * Coordinates are real WGS84 positions around Peshawar, Khyber Pakhtunkhwa,
 * and each place's neighbourhood, address and coordinates agree.
 */

export const authCopy = {
  loginEyebrow: 'Sign in',
  loginSubtitle:
    'Pick up where your circle left off — the places you trust, and who has been there.',
  registerEyebrow: 'Create an account',
  registerSubtitle:
    'A circle is small on purpose. Invite the people whose judgement you actually rely on.',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  nameLabel: 'Name',
  passwordHint: 'At least 8 characters, and not a guessable one.',
  signIn: 'Sign in',
  createAccount: 'Create account',
  forgotPassword: 'Forgot password?',
  noAccount: 'No circle yet?',
  createOne: 'Create one',
  haveAccount: 'Already with us?',
  signInInstead: 'Sign in instead',
  termsLabel: 'I agree to keep reviews honest, and to only claim places I have actually been to.',
  invalidCredentials: 'That email and password do not match an account.',
  loginFailed: 'We could not sign you in just now. Try again in a moment.',
  emailTaken: 'That email already has an account. Sign in instead?',
  registerFailed: 'We could not create your account just now. Try again in a moment.',
};

export const writeCopy = {
  stepEyebrow: 'New experience',
  optional: 'Optional',
  closeFlow: 'Discard this experience',
  continueLabel: 'Continue',
  choosePlaceFirst: 'Choose a place first',
  continueFrom: (name) => `Continue from ${name}`,
  searchPlaces: 'Search places in Peshawar',
  cantFindPlace: 'It may not be on Trust Circle yet.',
  addNewPlace: 'Add a new place',
  photoHint:
    'Photos are the difference between a claim and a memory. Add as many as you like, or none at all.',
  chooseFromLibrary: 'Choose from library',
  takePhoto: 'Take a photo',
  orUseSample: 'Or use one of ours',
  addSample: 'Add this sample photo',
  cover: 'Cover',
  coverHint: 'The first photo is used as the cover.',
  removeAll: 'Remove all',
  removeAllPhotos: 'Remove all photos',
  removePhoto: (n) => `Remove photo ${n}`,
  pickerBlocked:
    'Photo access is off, so the picker cannot open. Enable it in Settings, or add one of ours below.',
  cameraBlocked: 'Camera access is off. Enable it in Settings, or choose from your library.',
  skipPhotos: 'Skip photos for now',
  ratingHint:
    'One number for the whole visit. Trust Circle does not ask you to score food, service and cleanliness separately.',
  tapToRate: 'Tap a star to rate your visit.',
  oneNumberOnly: 'One number, not five',
  oneNumberWhy:
    'Split ratings turn a memory into a spreadsheet. You get to decide what mattered, and say so in your own words on the next step.',
  storyPrompt: 'What would you tell a friend?',
  storyPlaceholder:
    'Start with the thing you would say out loud when someone asks where to eat tonight…',
  storyNudge: 'A sentence or two is plenty.',
  storyTooShort: 'Give it a little more — at least a sentence.',
  storyAside:
    'Write it the way you would say it. Nobody is looking for a review, they are looking for your opinion.',
  dateHint:
    'How recent a visit was changes how much someone trusts it. Future dates are not available.',
  selectedDate: 'Visited',
  visibilityHint:
    'This is the one decision that decides who gets to read what you are about to write. You can change it later.',
  visibilityEnforced:
    'Visibility is enforced by the server, not by this app. Whatever you choose here is a request, not a lock.',
  reviewBeforeSharing: 'Review before sharing',
  previewEyebrow: 'Almost there',
  previewTitle: 'This is what your circle will see.',
  previewSubtitle:
    'Read it once as if a friend sent it to you. That is exactly how it will arrive.',
  visitedHere: 'Visited this location',
  originalPhotos: 'original photos',
  editPlace: 'Place',
  editPhotos: 'Photos',
  editRating: 'Rating',
  editVisitDate: 'Visited',
  editAudience: 'Audience',
  noPhotosYet: 'None yet',
  publish: 'Publish experience',
  publishing: 'Publishing…',
  previewIncomplete: 'Something is missing from your experience.',
  startOver: 'Discard and start over',
  clearSearch: 'Clear search',
  tryAgain: 'Try again',
  placeSearchFailed:
    'We could not reach Trust Circle just now. Check your connection, or pick again in a moment.',
  placeUncategorised: 'Place',
  yourName: 'You',
  visibleTo: 'Visible to',
  experienceLabel: 'Experience',
  backToStart: 'Back to the start',
  chosen: 'Chosen',
  photoLimitReached: 'Ten photos is the maximum for one experience.',
  photosOptionalNote:
    'Photos make an experience worth trusting, but they are not required. You can publish without one.',
  uploadOnPublish:
    'Photos upload when you publish, so a failed publish never re-uploads what already worked.',
  newPlaceEyebrow: 'New place',
  newPlaceHint: 'Add the details you know. Location can be rough — it can be corrected later.',
  newPlaceNameRequired: 'A place needs a name.',
  newPlaceNameLabel: 'Place name',
  newPlaceCategoryLabel: 'Category',
  newPlaceAddressLabel: 'Address',
  newPlaceCityLabel: 'City',
  addPlace: 'Add place',
  saving: 'Saving…',
  newPlaceFailed: 'That place could not be saved. Try again in a moment.',
  dedupNote:
    'If a similar place already exists nearby, Trust Circle will point you at it instead of creating a duplicate.',
  uploadingPhoto: (i, n) => `Uploading photo ${i} of ${n}…`,
  creatingExperience: 'Publishing…',
  photoAttachFailed:
    'Your photos could not be attached. Remove one and try again — nothing else you wrote was lost.',
  visitDateRejected: 'That visit date was rejected. Pick a date that is today or earlier.',
  placeVanished: 'That place is no longer available. Choose another one.',
  sessionExpired: 'Your session expired. Sign in again to publish.',
  publishFailed: 'That did not go through. Your draft is still here — try again.',
  back: 'Go back',
};

/* Write-review flow — keys beyond the original `writeCopy` block. */

export const experienceCopy = {
  experience: 'Experience',
  loading: 'Loading experience…',
  back: 'Go back',
  tryAgain: 'Try again',
  backToMap: 'Back to the map',
  // 403 NOT_VISIBLE — the experience exists, this viewer just cannot see it.
  hidden: 'This experience is not shared with you.',
  hiddenBody:
    "It was published to a smaller audience than the one you are in. That is the author's choice, not a bug.",
  // 404 EXPERIENCE_NOT_FOUND
  missing: 'This experience is gone.',
  missingBody: 'It may have been deleted by the person who wrote it.',
  failed: 'We could not load this experience.',
  failedBody: 'Check your connection and try again.',
  place: 'Place',
  visited: 'Visited',
  originalPhotos: 'original photos',
  viewPlace: 'View place',
};

export const exploreCopy = {
  eyebrow: 'Explore',
  title: 'Peshawar',
  searchPlaceholder: 'Search places, people or experiences…',
  noBio: 'No bio yet.',
  loadingPlaces: 'Looking around nearby…',
  placesFailed: 'We could not load nearby places.',
  meFailed: 'We could not load your profile.',
  noPlacesTitle: 'Nothing here yet',
  noPlacesBody:
    'No places match this search within 20 km. Try a different name, or add the place yourself.',
  addAPlace: 'Add a place',
  writeExperience: 'Write an experience here',
  experiencesVisible: 'experiences you can see',
  viewPlace: 'View place',
  place: 'Place',
};

export const circleCopyApi = {
  loading: 'Loading your circle…',
  failed: 'We could not load your circle.',
  noExperiences: 'No experiences shared with you yet',
  noExperiencesBody: 'When someone in your circle shares an experience, it will appear here.',
  requests: 'Requests',
  accept: 'Accept',
  decline: 'Decline',
  noRequests: 'No pending requests',
  filterCircle: 'Filter your circle',
  suggestionsTitle: 'People you might trust',
  suggestionsBody:
    'People who have been to the same places as you. Their shared visit has to be something you were both allowed to see.',
  suggestionsLoading: 'Looking for shared places…',
  suggestionsFailed: 'We could not find anyone just now.',
  suggestionsEmptyTitle: 'No shared places yet',
  suggestionsEmptyBody:
    'Share an experience somewhere and the people who have been there too will show up here.',
  searchByNameLink: 'Search by name instead',
  sharedPlaceOne: (name) => `Also at ${name}`,
  sharedPlaces: (names) => `Also at ${names.join(', ')}`,
  sharedPlacesAndMore: (names, total) =>
    `Also at ${names.join(', ')} +${total - names.length} more`,
  addToCircle: 'Add',
};

export const profileCopyApi = {
  loading: 'Loading your profile…',
  failed: 'We could not load your profile.',
  noExperiencesTitle: 'No experiences yet',
  noExperiencesBody: 'Visit somewhere, then write it up. It only reaches the people you choose.',
  writeFirst: 'Write your first experience',
  experiences: 'Experiences',
  friends: 'Circle',
  places: 'Places',
  photos: 'Photos',
  noPhotosTitle: 'No photos yet',
  noPhotosBody: 'Photos you attach to an experience show up here.',
  noPlacesTitle: 'No places yet',
  noPlacesBody: 'Places you write about will collect here.',
};

export const placeCopyApi = {
  loading: 'Loading place…',
  failed: 'We could not load this place.',
  noExperiencesTitle: 'No experiences yet',
  noExperiencesBody: 'Nobody you can see has written about this place. Be the first.',
  writeFirst: 'Write an experience',
  experienceCount: (n) => `${n} experiences you can see`,
  avgRating: (r) => `${r.toFixed(1)} average`,
  openExperience: 'Open experience',
};

export const peopleCopy = {
  title: 'Find people',
  back: 'Go back',
  placeholder: 'Search by name',
  add: 'Add',
  startTitle: 'Find the people you trust',
  startBody:
    'Search by name. Trust Circle shows only what you are allowed to see, so blocked people and your own account never appear.',
  noResultsBody: 'Try a different spelling, or fewer letters.',
  searchFailed: 'We could not search for people just now.',
  requestSent: 'Request sent. They will see it next time they open the app.',
  alreadyFriends: 'You are already in their circle.',
  theySentYouRequest: 'They have already sent you a request — accept it from your Circle screen.',
  cannotRequest: 'That request could not be sent.',
  blocked: 'You cannot connect with this person.',
  requestFailed: 'That request could not be sent. Try again in a moment.',
};
