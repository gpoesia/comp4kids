/*
 * Visualize all lessons in a course, and lets the user choose which one to play.
 */

var React = require("react");
var LessonOverview = require("./lesson_overview");
var LessonEnvironment = require("./lesson_environment");
var Popup = require("react-popup").default;
var T = require("../util/translate").T;
var sprintf = require("sprintf-js").sprintf;

var CourseOverview = React.createClass({
  _handleLessonSelected: function(lesson) {
    this.setState({
      currentLesson: lesson,
      initialChallenge: null,
    });
  },

  _handleLessonExit: function(finished) {
    if (finished) {
      var lesson = this.props.course.getLesson(this.state.currentLesson);
      Popup.create({
        title: T("Muito bem!"),
        content: sprintf(T("Parabéns! Você terminou a aula \"%s\"!"),
                         lesson.getLessonName()),
        buttons: {
          right: ["ok"],
        },
      });
    }
    this.setState({
      currentLesson: null,
    });
  },

  getInitialState: function() {
    return {
      currentLesson: null,
      initialChallenge: null,
    };
  },

  _handleChallengeSelected: function(lesson, challenge) {
    this.setState({
      currentLesson: lesson,
      initialChallenge: challenge,
    });
  },

  render: function() {
    var course = this.props.course;

    if (this.state.currentLesson !== null) {
      var lesson = course.getLesson(this.state.currentLesson);
      return <LessonEnvironment lesson={lesson}
                                course={course}
                                progressManager={this.props.progressManager}
                                initialChallenge={this.state.initialChallenge}
                                onLessonExit={this._handleLessonExit} />;
    }

    var lessons = [];

    for (var i = 0; i < course.getNumberOfLessons(); i++) {
      var lesson = course.getLesson(i);
      lessons.push(
          <LessonOverview
            key={i}
            course={course}
            lesson={lesson}
            progressManager={this.props.progressManager}
            onChallengeSelected={this._handleChallengeSelected.bind(this, i)}
            onLessonSelected={this._handleLessonSelected.bind(this, i)}
          />
      );
    }

    return (
      <div>
        <div>{lessons}</div>
      </div>
    );
  }
});

module.exports = CourseOverview;
