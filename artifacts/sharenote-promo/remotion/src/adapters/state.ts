export type {AppEvent,AppTask,FamilyMember,GroceryItem} from '../../../../sharenote-mobile/context/AppState';
const today = '2026-09-16';
const members = [
 {id:'m1',name:'David Smith',nickname:'David',role:'Parent',initials:'DS',color:'#5bb6ff'},
 {id:'m2',name:'Maya Smith',nickname:'Maya',role:'Parent',initials:'MS',color:'#9b5cf6'},
 {id:'m3',name:'Leo Smith',nickname:'Leo',role:'Child',initials:'LS',color:'#12c7a0'},
];
const events = [
 {id:'e1',title:'Dentist Appointment',time:'10:00 AM',date:today,personId:'m2',color:'#5bb6ff'},
 {id:'e2',title:'Baseball Practice',time:'4:30 PM',date:today,personId:'m3',color:'#12c7a0'},
 {id:'e3',title:'Family Dinner',time:'7:00 PM',date:today,personId:'m1',personIds:['m1','m2','m3'],color:'#9b5cf6'},
 {id:'e4',title:'Family outing',time:'10:00 AM',date:'2026-09-20',personId:'m1',color:'#f6a53a'},
 {id:'e5',title:'School meeting',time:'3:00 PM',date:'2026-09-24',personId:'m2',color:'#f04e9b'},
];
const tasks = [
 {id:'t1',title:'Take out garbage',time:'8:00 AM',date:today,location:'Home',personId:'m1',done:false,color:'#5bb6ff'},
 {id:'t2',title:'Finish homework',time:'4:00 PM',date:today,location:'School',personId:'m3',done:false,color:'#12c7a0'},
 {id:'t3',title:'Grocery shopping',time:'5:00 PM',date:today,location:'Personal',personId:'m2',done:false,color:'#9b5cf6'},
 {id:'t4',title:'Return library books',time:'6:00 PM',date:today,location:'Library',personId:'m3',done:false,color:'#f6a53a'},
 {id:'t5',title:'Pack lunch for tomorrow',time:'7:30 PM',date:today,location:'Home',personId:'m1',done:false,color:'#f04e9b'},
 {id:'t6',title:'Water the plants',time:'8:00 PM',date:today,location:'Home',personId:'m2',done:true,color:'#12c7a0'},
];
const groceries = [
 {id:'g1',name:'Apples (Honeycrisp)',category:'Produce',checked:false,personId:'m2'},
 {id:'g2',name:'Spinach',category:'Produce',checked:false},
 {id:'g3',name:'Oat Milk',category:'Dairy & Fridge',checked:false},
 {id:'g4',name:'Greek Yogurt (Vanilla)',category:'Dairy & Fridge',checked:false},
 {id:'g5',name:'Bread',category:'Bakery',checked:true},
 {id:'g6',name:'Eggs',category:'Dairy',checked:true},
 {id:'g7',name:'Rice',category:'Pantry',checked:true},
 {id:'g8',name:'Sourdough Bread',category:'Bakery',checked:false,personId:'m1'},
 {id:'g9',name:'Blueberries',category:'Fruits',checked:false,personId:'m3'},
 {id:'g10',name:'Sparkling Water',category:'Drinks',checked:false},
];
const noop = ()=>{};
export const useAppState = () => ({members,dashboardMembers:[],events,dashboardEvents:[],tasks,groceries,activeProfile:members[1],canManageFamily:true,deleteEvent:noop,deleteTask:noop,toggleTask:noop,toggleGroceryItem:noop,addGroceryItem:noop,removeGroceryItem:noop});
