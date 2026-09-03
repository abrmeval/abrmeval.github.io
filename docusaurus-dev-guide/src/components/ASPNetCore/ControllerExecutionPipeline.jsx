import React, { useState } from 'react';
import { ArrowDown, PlayCircle, Settings, CheckCircle, AlertCircle } from 'lucide-react';

const ControllerExecutionPipeline = () => {
  const [activeStep, setActiveStep] = useState(null);

  const executionSteps = [
    {
      name: "Endpoint Middleware",
      icon: "🎯",
      description: "Request reaches the matched endpoint",
      details: "The routing middleware has determined this request should be handled by ProductsController.GetById(123)",
      color: "purple"
    },
    {
      name: "Model Binding",
      icon: "📦",
      description: "Framework extracts and converts parameter values",
      details: "ASP.NET Core reads route values, query strings, headers, and body to populate action method parameters. For example, it converts the string '123' from the URL into an integer parameter.",
      color: "blue"
    },
    {
      name: "Controller Constructor",
      icon: "🏗️",
      description: "Controller instance is created",
      details: "The DI container creates a new instance of your controller class and injects all dependencies declared in the constructor. This happens on EVERY request - controllers are not singletons.",
      color: "green",
      important: true
    },
    {
      name: "Authorization Filters",
      icon: "🔐",
      description: "[Authorize] attributes execute",
      details: "Checks permissions at the controller or action level. Can short-circuit and return 401/403. Runs AFTER constructor but is the first filter type to execute.",
      color: "red",
      canShortCircuit: true
    },
    {
      name: "Resource Filters (Before)",
      icon: "⚡",
      description: "Runs before model binding",
      details: "Can short-circuit the pipeline. Useful for caching - if cache hit, return cached response without executing action. Implements IResourceFilter or IAsyncResourceFilter.",
      color: "orange",
      canShortCircuit: true
    },
    {
      name: "Action Filters (Before)",
      icon: "🎬",
      description: "OnActionExecuting runs",
      details: "Runs immediately before your action method. Can modify arguments, add data to HttpContext, or short-circuit. Common for logging, validation, or modifying input.",
      color: "indigo",
      canShortCircuit: true
    },
    {
      name: "Action Method Execution",
      icon: "⚙️",
      description: "Your controller action runs",
      details: "Your actual business logic executes here. Parameters are already bound, filters have run, and now your code does the real work of the application.",
      color: "pink",
      highlight: true
    },
    {
      name: "Action Filters (After)",
      icon: "🎬",
      description: "OnActionExecuted runs",
      details: "Runs after action method completes but before result is executed. Can modify the ActionResult. Has access to the result and can see if an exception occurred.",
      color: "indigo"
    },
    {
      name: "Result Filters (Before)",
      icon: "📋",
      description: "OnResultExecuting runs",
      details: "Runs before the result is executed (before JSON serialization, view rendering, etc.). Can modify the result or short-circuit result execution.",
      color: "teal",
      canShortCircuit: true
    },
    {
      name: "Result Execution",
      icon: "🎨",
      description: "ActionResult executes",
      details: "The result is processed - JSON is serialized, views are rendered, files are prepared, redirects happen, etc. This converts your result into an HTTP response.",
      color: "cyan"
    },
    {
      name: "Result Filters (After)",
      icon: "📋",
      description: "OnResultExecuted runs",
      details: "Runs after result execution. Can perform cleanup or logging but cannot modify the result anymore since it's already been written to the response.",
      color: "teal"
    },
    {
      name: "Resource Filters (After)",
      icon: "⚡",
      description: "Cleanup and final processing",
      details: "Runs after everything else. Common for resource cleanup or storing results in cache. Always runs even if earlier stages short-circuited.",
      color: "orange"
    },
    {
      name: "Exception Filters",
      icon: "❌",
      description: "Only if exception occurs",
      details: "Catches exceptions from action methods or filters. Can handle exceptions and return custom error responses. Doesn't catch exceptions from resource filters or result execution.",
      color: "red",
      special: true
    },
    {
      name: "Controller Disposal",
      icon: "🗑️",
      description: "Controller instance is disposed",
      details: "If controller implements IDisposable, Dispose() is called. Injected dependencies are released back to the DI container. Controller is never reused.",
      color: "gray"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      purple: 'bg-purple-100 border-purple-500 text-purple-800',
      blue: 'bg-blue-100 border-blue-500 text-blue-800',
      green: 'bg-green-100 border-green-500 text-green-800',
      red: 'bg-red-100 border-red-500 text-red-800',
      orange: 'bg-orange-100 border-orange-500 text-orange-800',
      indigo: 'bg-indigo-100 border-indigo-500 text-indigo-800',
      pink: 'bg-pink-100 border-pink-500 text-pink-800',
      teal: 'bg-teal-100 border-teal-500 text-teal-800',
      cyan: 'bg-cyan-100 border-cyan-500 text-cyan-800',
      gray: 'bg-gray-100 border-gray-500 text-gray-800'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Controller Execution Pipeline Deep Dive
        </h2>
        <p className="text-gray-600 mb-6">
          What happens after routing finds your controller? Click to explore each step.
        </p>

        {/* Timeline */}
        <div className="relative">
          {executionSteps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < executionSteps.length - 1 && !step.special && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300 z-0" />
              )}
              
              {/* Step card */}
              <button
                onClick={() => setActiveStep(activeStep === index ? null : index)}
                className={`w-full text-left mb-4 transition-all ${
                  activeStep === index
                    ? 'scale-[1.02] shadow-lg'
                    : 'hover:scale-[1.01]'
                } ${step.highlight ? 'ring-4 ring-pink-300' : ''}`}
              >
                <div className={`border-2 rounded-lg p-4 ${getColorClasses(step.color)}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl mt-1">{step.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg flex items-center gap-2">
                        {step.name}
                        {step.important && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                            IMPORTANT
                          </span>
                        )}
                        {step.canShortCircuit && (
                          <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded">
                            Can Stop Pipeline
                          </span>
                        )}
                        {step.special && (
                          <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">
                            Conditional
                          </span>
                        )}
                      </div>
                      <div className="text-sm mt-1 opacity-90">
                        {step.description}
                      </div>
                      
                      {activeStep === index && (
                        <div className="mt-3 p-3 bg-white bg-opacity-80 rounded text-sm border border-current border-opacity-20">
                          {step.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Filter Order Reference */}
        <div className="mt-8 p-5 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">
            📚 Filter Execution Order Summary
          </h3>
          <div className="space-y-2 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[160px]">Authorization →</span>
              <span>Resource → Action → Exception → Result</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[160px]">Scope Order:</span>
              <span>Global → Controller → Action (each filter type follows this)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold min-w-[160px]">Response Path:</span>
              <span>Filters execute in reverse order on the way back</span>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <h4 className="font-semibold text-green-900 mb-2">💡 Constructor Facts</h4>
            <div className="text-sm text-green-800 space-y-1">
              <p>• Created fresh for every request</p>
              <p>• Dependencies injected automatically</p>
              <p>• Don't do heavy work here - use filters</p>
              <p>• Disposed after request completes</p>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">🎯 Filter Best Practices</h4>
            <div className="text-sm text-purple-800 space-y-1">
              <p>• Use ActionFilters for cross-cutting concerns</p>
              <p>• Authorization filters for permission checks</p>
              <p>• Resource filters for caching scenarios</p>
              <p>• Exception filters for error handling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControllerExecutionPipeline;