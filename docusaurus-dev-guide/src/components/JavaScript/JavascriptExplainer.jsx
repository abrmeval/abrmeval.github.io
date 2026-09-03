import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Link } from 'lucide-react';

export default function JavascriptExplainer() {
  const [activeSection, setActiveSection] = useState('basics');
  const [expandedExample, setExpandedExample] = useState(null);

  const toggleExample = (id) => {
    setExpandedExample(expandedExample === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Understanding JavaScript Prototypes</h1>
          <p className="text-blue-100">An interactive guide to one of JavaScript's most powerful features</p>
        </div>

        {/* Navigation */}
        <div className="flex border-b">
          {['basics', 'chain', 'inheritance', 'practice'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeSection === section
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {section === 'basics' && 'The Basics'}
              {section === 'chain' && 'Prototype Chain'}
              {section === 'inheritance' && 'Inheritance'}
              {section === 'practice' && 'Try It Out'}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Basics Section */}
          {activeSection === 'basics' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">What is a Prototype?</h2>
              
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
                <p className="text-lg text-gray-700 leading-relaxed">
                  Think of a prototype as a <span className="font-semibold text-blue-600">template or blueprint</span> that objects can reference. 
                  When you try to access a property on an object and it doesn't exist, JavaScript automatically looks 
                  at the object's prototype to see if the property exists there. It's like having a backup plan!
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Visual Representation</h3>
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <div className="space-y-4">
                    {/* Object */}
                    <div className="bg-white p-4 rounded-lg shadow border-2 border-blue-400">
                      <div className="font-mono text-sm">
                        <div className="text-blue-600 font-bold mb-2">myObject</div>
                        <div className="ml-4 text-gray-700">
                          name: "Alice"<br/>
                          age: 25
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="border-l-2 border-gray-400 h-8"></div>
                        <span className="text-sm font-semibold">[[Prototype]] link</span>
                      </div>
                    </div>
                    
                    {/* Prototype */}
                    <div className="bg-white p-4 rounded-lg shadow border-2 border-green-400">
                      <div className="font-mono text-sm">
                        <div className="text-green-600 font-bold mb-2">Object.prototype</div>
                        <div className="ml-4 text-gray-700">
                          toString: function<br/>
                          hasOwnProperty: function<br/>
                          valueOf: function
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Real Example</h3>
                <CodeExample
                  id="basics-1"
                  title="Creating an object and accessing prototype methods"
                  code={`// Create a simple object
const person = {
  name: "Alice",
  age: 25
};

// This property exists on the object itself
console.log(person.name); // "Alice"

// This method doesn't exist on person, but JavaScript
// finds it on Object.prototype (the prototype)
console.log(person.toString()); // "[object Object]"

// We can check if a property is on the object itself
console.log(person.hasOwnProperty("name")); // true
console.log(person.hasOwnProperty("toString")); // false (it's on the prototype!)`}
                  expanded={expandedExample === 'basics-1'}
                  toggle={() => toggleExample('basics-1')}
                />
              </div>
            </div>
          )}

          {/* Prototype Chain Section */}
          {activeSection === 'chain' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">The Prototype Chain</h2>
              
              <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded">
                <p className="text-lg text-gray-700 leading-relaxed">
                  The prototype chain is like a <span className="font-semibold text-purple-600">chain of backup locations</span>. 
                  If JavaScript can't find a property on an object, it checks the object's prototype. If it's not there, 
                  it checks the prototype's prototype, and so on, until it reaches the end of the chain (which is always null).
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">How the Chain Works</h3>
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <div className="space-y-3">
                    {[
                      { name: 'Your Object', props: 'name: "Alice"', color: 'blue' },
                      { name: 'Constructor Prototype', props: 'greet: function', color: 'green' },
                      { name: 'Object.prototype', props: 'toString, hasOwnProperty', color: 'yellow' },
                      { name: 'null', props: '(end of chain)', color: 'gray' }
                    ].map((level, index) => (
                      <div key={index}>
                        <div className={`bg-white p-4 rounded-lg shadow border-2 border-${level.color}-400`}>
                          <div className="font-mono text-sm">
                            <div className={`text-${level.color}-600 font-bold`}>{level.name}</div>
                            <div className="text-gray-600 text-xs mt-1">{level.props}</div>
                          </div>
                        </div>
                        {index < 3 && (
                          <div className="flex justify-center my-2">
                            <ChevronDown className="text-gray-400" size={24} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <CodeExample
                id="chain-1"
                title="Following the prototype chain"
                code={`// Constructor function
function Person(name) {
  this.name = name; // Property on the instance
}

// Method on the prototype
Person.prototype.greet = function() {
  return "Hi, I'm " + this.name;
};

const alice = new Person("Alice");

// Step 1: Look for 'name' on alice object → FOUND!
console.log(alice.name); // "Alice"

// Step 2: Look for 'greet' on alice → NOT FOUND
// Step 3: Look on Person.prototype → FOUND!
console.log(alice.greet()); // "Hi, I'm Alice"

// Step 4: Look for 'toString' on alice → NOT FOUND
// Step 5: Look on Person.prototype → NOT FOUND
// Step 6: Look on Object.prototype → FOUND!
console.log(alice.toString()); // "[object Object]"

// Look for something that doesn't exist anywhere
console.log(alice.flyToMoon); // undefined (reached null, the end)`}
                expanded={expandedExample === 'chain-1'}
                toggle={() => toggleExample('chain-1')}
              />
            </div>
          )}

          {/* Inheritance Section */}
          {activeSection === 'inheritance' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Prototypal Inheritance</h2>
              
              <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded">
                <p className="text-lg text-gray-700 leading-relaxed">
                  Prototypal inheritance allows objects to <span className="font-semibold text-green-600">share methods and properties</span>. 
                  Instead of copying methods to every object, we put them on the prototype once, and all instances can use them. 
                  This saves memory and makes your code more efficient!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                  <h4 className="font-bold text-red-700 mb-2">❌ Without Prototypes</h4>
                  <p className="text-sm text-gray-700">Each object gets its own copy of methods. If you create 1000 objects, you get 1000 copies of the same function!</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                  <h4 className="font-bold text-green-700 mb-2">✅ With Prototypes</h4>
                  <p className="text-sm text-gray-700">Methods live on the prototype. All 1000 objects share the same function in memory. Much more efficient!</p>
                </div>
              </div>

              <CodeExample
                id="inheritance-1"
                title="Inefficient way (without prototypes)"
                code={`function PersonBad(name, age) {
  this.name = name;
  this.age = age;
  
  // Each object gets its own copy of this function!
  this.greet = function() {
    return "Hi, I'm " + this.name;
  };
}

const person1 = new PersonBad("Alice", 25);
const person2 = new PersonBad("Bob", 30);

// These are different functions (inefficient!)
console.log(person1.greet === person2.greet); // false`}
                expanded={expandedExample === 'inheritance-1'}
                toggle={() => toggleExample('inheritance-1')}
              />

              <CodeExample
                id="inheritance-2"
                title="Efficient way (with prototypes)"
                code={`function PersonGood(name, age) {
  this.name = name;
  this.age = age;
}

// Put the method on the prototype (shared by all instances)
PersonGood.prototype.greet = function() {
  return "Hi, I'm " + this.name;
};

PersonGood.prototype.introduce = function() {
  return this.greet() + " and I'm " + this.age + " years old";
};

const person1 = new PersonGood("Alice", 25);
const person2 = new PersonGood("Bob", 30);

// Both objects share the same function (efficient!)
console.log(person1.greet === person2.greet); // true

console.log(person1.introduce()); // "Hi, I'm Alice and I'm 25 years old"
console.log(person2.introduce()); // "Hi, I'm Bob and I'm 30 years old"`}
                expanded={expandedExample === 'inheritance-2'}
                toggle={() => toggleExample('inheritance-2')}
              />
            </div>
          )}

          {/* Practice Section */}
          {activeSection === 'practice' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Practice & Key Takeaways</h2>
              
              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded">
                <h3 className="font-bold text-indigo-800 text-xl mb-3">🎯 Key Points to Remember</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-semibold">1.</span> Every object has a hidden link to a prototype object</p>
                  <p><span className="font-semibold">2.</span> When you access a property, JavaScript searches the prototype chain</p>
                  <p><span className="font-semibold">3.</span> Prototypes let objects share methods efficiently</p>
                  <p><span className="font-semibold">4.</span> The chain always ends with null</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Modern JavaScript</h3>
                <CodeExample
                  id="practice-1"
                  title="Using ES6 Classes (which use prototypes under the hood!)"
                  code={`// Modern syntax, but still uses prototypes behind the scenes!
class Animal {
  constructor(name) {
    this.name = name;
  }
  
  // This method goes on Animal.prototype
  speak() {
    return this.name + " makes a sound";
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // Call parent constructor
    this.breed = breed;
  }
  
  // This method goes on Dog.prototype
  speak() {
    return this.name + " barks!";
  }
  
  fetch() {
    return this.name + " is fetching the ball";
  }
}

const myDog = new Dog("Buddy", "Golden Retriever");

console.log(myDog.speak()); // "Buddy barks!"
console.log(myDog.fetch()); // "Buddy is fetching the ball"

// The prototype chain: myDog → Dog.prototype → Animal.prototype → Object.prototype → null
console.log(myDog instanceof Dog); // true
console.log(myDog instanceof Animal); // true
console.log(myDog instanceof Object); // true`}
                  expanded={expandedExample === 'practice-1'}
                  toggle={() => toggleExample('practice-1')}
                />
              </div>

              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-lg mt-6">
                <h3 className="font-bold text-gray-800 text-xl mb-3">💡 The Big Picture</h3>
                <p className="text-gray-700 leading-relaxed">
                  Prototypes are JavaScript's way of implementing inheritance and code reuse. Instead of copying 
                  methods to every object, JavaScript creates a chain where objects can borrow from their prototypes. 
                  This makes your code more memory-efficient and follows the DRY (Don't Repeat Yourself) principle. 
                  Even modern ES6 classes are just syntactic sugar over this prototype system!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CodeExample({ id, title, code, expanded, toggle }) {
  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggle}
        className="w-full bg-gray-100 hover:bg-gray-200 p-4 flex items-center justify-between transition-colors"
      >
        <span className="font-semibold text-gray-800">{title}</span>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>
      {expanded && (
        <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
          <code className="text-sm">{code}</code>
        </pre>
      )}
    </div>
  );
}