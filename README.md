## UML Diagram

```mermaid
classDiagram
    Users "1" --> "0..*" Posts : creates
    Users "1" --> "0..*" Comments : creates
    Posts "1" --> "0..*" Comments : has
    Posts "1" --> "0..*" Images : has

    class Comments {
      int id
      int post_id
      int user_id
      String content
    }

    class Users {
      int Id
      String Name
      String Link
    }

    class Posts {
      int Id
      int Author_id
      String content
    }

    class Images {
      int Id
      int post_id
      String imageUrl
    }
